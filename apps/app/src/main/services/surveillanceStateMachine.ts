import { BrowserWindow, Notification } from 'electron';
import { getMainWindow } from '../windows/manager';
import { judgeWindowTitle } from './aiJudgeService';

// 감시 상태
export enum SurveillanceState {
    NORMAL = 'NORMAL',              // 정상 (입력 감지됨)
    SUSPICIOUS = 'SUSPICIOUS',       // 의심 (입력 없음, 오디오 확인 중)
    AUDIO_DETECTED = 'AUDIO_DETECTED', // 오디오 감지 (인강/버튜버 가능성)
    AI_JUDGING = 'AI_JUDGING',       // AI 판단 중
    FINAL_WARNING = 'FINAL_WARNING', // 최후의 변론 (5분 대기)
    PUNISHED = 'PUNISHED'            // 처벌됨
}

// 상태 머신 클래스
export class SurveillanceStateMachine {
    private state: SurveillanceState = SurveillanceState.NORMAL;
    private lastInputTime: number = Date.now();
    private finalWarningStartTime: number | null = null;
    private finalWarningTimeout: NodeJS.Timeout | null = null;

    // 창 제목 추적 (변경 감지 및 빈도 제한)
    private lastWindowTitle: string = '';
    private lastJudgeTime: number = 0;
    private lastJudgeTitle: string = '';

    // 설정
    private readonly IDLE_THRESHOLD = 600; // 10분 (초)
    private readonly FINAL_WARNING_TIMEOUT = 5 * 60 * 1000; // 5분 (밀리초)
    private readonly MIN_JUDGE_INTERVAL = 30 * 1000; // 같은 창 제목에 대해 최소 30초 간격으로 판단

    // 상태 변경 콜백
    private onStateChange?: (state: SurveillanceState) => void;

    constructor(onStateChange?: (state: SurveillanceState) => void) {
        this.onStateChange = onStateChange;
    }

    // 상태 업데이트 (네이티브 모니터에서 호출)
    async updateStatus(status: {
        idle_time: number;
        window_title: string;
        audio_playing: boolean;
        pid: number;
        process_name: string;
    }): Promise<void> {
        const now = Date.now();

        // 게임 감지 (우선순위: 가장 먼저 체크)
        if (status.process_name || status.window_title) {
            const isGame = await this.checkIfGame(status.window_title, status.process_name);
            if (isGame) {
                console.log(`[Surveillance] Game detected! PID: ${status.pid}`);
                // 즉시 종료 대신 사용자에게 물어보기
                await this.askToKillGame(status.window_title, status.process_name, status.pid);
                return;
            }
        }

        // 1단계: 물리적 생존 확인
        const hasRecentInput = status.idle_time < 60; // 1분 이내 입력 감지

        if (hasRecentInput) {
            this.lastInputTime = now;
            // 입력이 있으면 정상으로 간주하고 AI 판단 스킵 (너무 자주 판단하지 않음)
            if (this.state !== SurveillanceState.NORMAL) {
                this.setState(SurveillanceState.NORMAL);
                this.cancelFinalWarning();
            }
            // 창 제목 추적 업데이트
            this.lastWindowTitle = status.window_title || '';
            return; // 입력이 있으면 더 이상 진행하지 않음
        }

        // 입력이 없음 -> 의심 상태
        if (this.state === SurveillanceState.NORMAL) {
            this.setState(SurveillanceState.SUSPICIOUS);
        }

        // 창 제목 변경 감지
        const windowTitleChanged = status.window_title !== this.lastWindowTitle;
        this.lastWindowTitle = status.window_title || '';

        // 2단계: 청각적 생존 확인
        if (status.audio_playing) {
            if (this.state === SurveillanceState.SUSPICIOUS) {
                this.setState(SurveillanceState.AUDIO_DETECTED);
            }
            // 오디오가 있고 창 제목이 변경되었을 때만 AI 판단 (빈도 제한)
            if (windowTitleChanged || this.shouldJudgeAgain(status.window_title)) {
                await this.stage3_AIJudging(status.window_title);
            }
            return;
        }

        // 오디오 없음 + 10분 이상 부재 -> 4단계 최후의 변론
        if (status.idle_time > this.IDLE_THRESHOLD && !status.audio_playing) {
            if (this.state !== SurveillanceState.FINAL_WARNING &&
                this.state !== SurveillanceState.PUNISHED) {
                await this.stage4_FinalWarning();
            }
        }
    }

    // 같은 창 제목에 대해 다시 판단해야 하는지 확인
    private shouldJudgeAgain(windowTitle: string): boolean {
        if (!windowTitle || windowTitle.trim().length === 0) {
            return false;
        }

        // 창 제목이 다르면 판단
        if (windowTitle !== this.lastJudgeTitle) {
            return true;
        }

        // 같은 창 제목이면 최소 간격 확인
        const timeSinceLastJudge = Date.now() - this.lastJudgeTime;
        return timeSinceLastJudge >= this.MIN_JUDGE_INTERVAL;
    }

    // 게임 감지 (AI 판사 사용)
    private async checkIfGame(windowTitle: string, processName: string): Promise<boolean> {
        try {
            const verdict = await judgeWindowTitle(windowTitle, processName);
            return verdict === 'DISTRACTION';
        } catch (error) {
            console.error('[Surveillance] Game detection error:', error);
            return false; // 에러 시 게임이 아니라고 간주
        }
    }

    // 프로세스 종료
    private killProcess(pid: number): void {
        try {
            const { exec } = require('child_process');
            const os = require('os');

            if (os.platform() === 'win32') {
                // Windows
                exec(`taskkill /F /PID ${pid}`, (error: any) => {
                    if (error) {
                        console.error(`[Surveillance] Failed to kill process ${pid}:`, error);
                    } else {
                        console.log(`[Surveillance] Process ${pid} killed successfully`);
                    }
                });
            } else {
                // macOS/Linux
                exec(`kill -TERM ${pid}`, (error: any) => {
                    if (error) {
                        // TERM 실패 시 KILL 시도
                        exec(`kill -KILL ${pid}`, (killError: any) => {
                            if (killError) {
                                console.error(`[Surveillance] Failed to kill process ${pid}:`, killError);
                            } else {
                                console.log(`[Surveillance] Process ${pid} force killed`);
                            }
                        });
                    } else {
                        console.log(`[Surveillance] Process ${pid} terminated`);
                    }
                });
            }
        } catch (error) {
            console.error(`[Surveillance] Error killing process ${pid}:`, error);
        }
    }

    // 3단계: AI 판사
    private async stage3_AIJudging(windowTitle: string): Promise<void> {
        if (this.state === SurveillanceState.AI_JUDGING) {
            return; // 이미 판단 중
        }

        if (!windowTitle || windowTitle.trim().length === 0) {
            return; // 창 제목이 없으면 판단 불가
        }

        // 빈도 제한 확인
        if (!this.shouldJudgeAgain(windowTitle)) {
            return; // 최근에 판단했으면 스킵
        }

        this.setState(SurveillanceState.AI_JUDGING);
        this.lastJudgeTime = Date.now();
        this.lastJudgeTitle = windowTitle;

        try {
            const verdict = await judgeWindowTitle(windowTitle);

            if (verdict === 'STUDY') {
                // 공부 중 -> 정상으로 복귀
                this.lastInputTime = Date.now();
                this.setState(SurveillanceState.NORMAL);
            } else {
                // DISTRACTION -> 4단계로 이동
                await this.stage4_FinalWarning();
            }
        } catch (error) {
            console.error('[Surveillance] AI judging error:', error);
            // 에러 발생 시 보수적으로 공부로 간주
            this.lastInputTime = Date.now();
            this.setState(SurveillanceState.NORMAL);
        }
    }

    // 4단계: 최후의 변론
    private async stage4_FinalWarning(): Promise<void> {
        if (this.state === SurveillanceState.FINAL_WARNING) {
            return; // 이미 경고 중
        }

        this.setState(SurveillanceState.FINAL_WARNING);
        this.finalWarningStartTime = Date.now();

        // UI에 최후의 변론 알림
        this.notifyFinalWarning();

        // 5분 타이머 시작
        this.finalWarningTimeout = setTimeout(() => {
            this.punish();
        }, this.FINAL_WARNING_TIMEOUT);
    }

    // 최후의 변론 취소 (사용자가 응답함)
    public cancelFinalWarning(): void {
        if (this.finalWarningTimeout) {
            clearTimeout(this.finalWarningTimeout);
            this.finalWarningTimeout = null;
        }
        this.finalWarningStartTime = null;

        if (this.state === SurveillanceState.FINAL_WARNING) {
            this.setState(SurveillanceState.NORMAL);
        }
    }

    // 처벌
    private punish(): void {
        this.setState(SurveillanceState.PUNISHED);

        // 1. 수치심 기록소 기록
        this.recordShame();

        // 2. 자리비움 상태로 전환
        this.notifyAbsence();

        console.log('[Surveillance] 주인님 처벌됨 - 수치심 기록 및 자리비움 상태 전환');
    }

    // 수치심 기록
    private recordShame(): void {
        // TODO: 데이터베이스나 파일에 기록
        console.log('[Surveillance] 수치심 기록소에 기록됨');
    }

    // 자리비움 알림
    private notifyAbsence(): void {
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('surveillance-absence');
        }
    }

    // 최후의 변론 알림
    private notifyFinalWarning(): void {
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('surveillance-final-warning', {
                timeout: this.FINAL_WARNING_TIMEOUT,
                startTime: this.finalWarningStartTime
            });
        }
    }

    // 게임 감지 알림
    private notifyGameDetected(windowTitle: string, processName: string): void {
        console.log('[Surveillance] Sending game detection notification...');

        // 알림 지원 여부 확인
        if (!Notification.isSupported()) {
            console.warn('[Surveillance] Notifications are not supported on this system');
            return;
        }

        // 시스템 알림 표시
        const notification = new Notification({
            title: '🎮 게임이 감지되었습니다!',
            body: `"${processName || windowTitle}"이(가) 종료되었습니다. 공부에 집중하세요!`,
            silent: false
        });

        notification.on('show', () => {
            console.log('[Surveillance] Notification shown successfully');
        });

        notification.on('failed', (event, error) => {
            console.error('[Surveillance] Notification error:', error);
        });

        notification.show();

        // renderer 프로세스에도 이벤트 전송 (UI 업데이트용)
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('surveillance-game-detected', {
                windowTitle,
                processName,
                timestamp: Date.now()
            });
        }
    }

    // 게임 종료 여부 묻기 (macOS 알림 액션 사용)
    private async askToKillGame(windowTitle: string, processName: string, pid: number): Promise<void> {
        console.log('[Surveillance] Asking user to kill game via Notification...');

        // 알림 지원 여부 확인
        if (!Notification.isSupported()) {
            console.warn('[Surveillance] Notifications not supported, falling back to kill');
            this.killProcess(pid);
            return;
        }

        const notification = new Notification({
            title: '⚠️ 딴짓 감지!',
            subtitle: processName || windowTitle,
            body: '공부 시간입니다. 정말 종료하시겠습니까?',
            silent: false,
            actions: [
                { type: 'button', text: '종료하기' }
            ],
            closeButtonText: '무시하기',
            urgency: 'critical'
        });

        // 액션 버튼 클릭 핸들러
        notification.on('action', (event, index) => {
            // index 0: 종료하기
            if (index === 0) {
                console.log(`[Surveillance] User clicked Terminate for process ${pid}`);
                this.killProcess(pid);

                // 종료 확인 알림
                new Notification({
                    title: '처리 완료',
                    body: '프로세스가 종료되었습니다. 공부 화이팅! 💪',
                    silent: true
                }).show();
            }
        });

        notification.on('close', () => {
            console.log('[Surveillance] Notification closed (ignored)');
        });

        notification.show();
    }

    // 상태 변경
    private setState(newState: SurveillanceState): void {
        if (this.state !== newState) {
            const oldState = this.state;
            this.state = newState;
            // 중요한 상태 변경만 로그 출력
            if (newState === SurveillanceState.FINAL_WARNING ||
                newState === SurveillanceState.PUNISHED ||
                (oldState === SurveillanceState.FINAL_WARNING && newState === SurveillanceState.NORMAL)) {
                console.log(`[Surveillance] State changed: ${oldState} -> ${newState}`);
            }

            if (this.onStateChange) {
                this.onStateChange(newState);
            }
        }
    }

    // 현재 상태
    public getState(): SurveillanceState {
        return this.state;
    }

    // 최후의 변론 남은 시간
    public getFinalWarningRemainingTime(): number | null {
        if (this.finalWarningStartTime === null) {
            return null;
        }
        const elapsed = Date.now() - this.finalWarningStartTime;
        const remaining = this.FINAL_WARNING_TIMEOUT - elapsed;
        return Math.max(0, remaining);
    }
}

