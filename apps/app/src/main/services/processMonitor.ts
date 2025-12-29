import { spawn, ChildProcess } from 'child_process';
import path from 'node:path';
import os from 'os';
import { app } from 'electron';
import fs from 'fs';
import { SurveillanceStateMachine, SurveillanceState } from './surveillanceStateMachine';

let nativeProcess: ChildProcess | null = null;
let isRestarting = false;
let stateMachine: SurveillanceStateMachine | null = null;

const startNativeProcess = (): void => {
    if (isRestarting) return;
    
    const isWin = os.platform() === 'win32';
    const executableName = isWin ? 'monitor_win.exe' : 'monitor_mac';
    
    // 빌드된 네이티브 실행 파일 경로 찾기
    let executablePath: string;
    
    // 개발 환경: build/native 디렉토리
    const devPath = path.join(__dirname, '../../build/native', executableName);
    // 프로덕션 환경: resources/native 디렉토리 (패키징 후)
    const prodPath = path.join(process.resourcesPath, 'native', executableName);
    // 대체 경로: src/native 디렉토리 (직접 실행)
    const srcPath = path.join(__dirname, '../../src/native', executableName);
    
    if (fs.existsSync(devPath)) {
        executablePath = devPath;
    } else if (fs.existsSync(prodPath)) {
        executablePath = prodPath;
    } else if (fs.existsSync(srcPath)) {
        executablePath = srcPath;
    } else {
        console.error(`[ProcessMonitor] Native monitor executable not found. Tried: ${devPath}, ${prodPath}, ${srcPath}`);
        console.error('[ProcessMonitor] Please build the native monitor first using: npm run build:native');
        return;
    }

    console.log(`[ProcessMonitor] Starting native monitor: ${executablePath}`);
    nativeProcess = spawn(executablePath, [], {
        stdio: ['ignore', 'pipe', 'pipe']
    });

    // stdout 핸들러 - JSON 데이터 처리
    nativeProcess.stdout?.on('data', async (data) => {
        const lines = data.toString().trim().split('\n');
        for (const line of lines) {
            if (!line.trim()) continue;
            
            try {
                const status = JSON.parse(line);
                // 로그는 필요할 때만 출력 (너무 자주 출력하지 않음)
                // console.log('[ProcessMonitor] Status received:', status);

                // 상태 머신에 상태 업데이트 전달
                if (stateMachine) {
                    await stateMachine.updateStatus({
                        idle_time: status.idle_time || 0,
                        window_title: status.window_title || status.app_name || '',
                        audio_playing: status.audio_playing === 1 || status.audio_playing === true,
                        pid: status.pid || 0,
                        process_name: status.process_name || ''
                    });
                }

            } catch (e) { 
                // JSON이 아닌 경우 무시 (디버그 로그 등)
                console.log("[ProcessMonitor] Non-JSON line:", line);
            }
        }
    });

    // stderr 핸들러 - 디버깅 로그 출력
    nativeProcess.stderr?.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        for (const line of lines) {
            if (line.trim()) {
                console.log(`[Native DEBUG] ${line}`);
            }
        }
    });

    // 프로세스 종료 핸들러
    nativeProcess.on('exit', (code, signal) => {
        console.log(`[ProcessMonitor] Native monitor process exited with code ${code}, signal ${signal}`);
        
        // 롤 감지로 정상 종료된 경우 (code 0) 재시작하지 않음
        if (code === 0) {
            console.log('[ProcessMonitor] Native monitor process exited normally (likely League detected)');
            nativeProcess = null;
            return;
        }
        
        // 비정상 종료된 경우 재시작
        if (!isRestarting) {
            console.log('[ProcessMonitor] Native monitor process crashed, restarting in 2 seconds...');
            isRestarting = true;
            setTimeout(() => {
                isRestarting = false;
                startNativeProcess();
            }, 2000);
        }
    });

    // 에러 핸들러
    nativeProcess.on('error', (error) => {
        console.error('[ProcessMonitor] Native monitor process error:', error);
        if (!isRestarting) {
            isRestarting = true;
            setTimeout(() => {
                isRestarting = false;
                startNativeProcess();
            }, 2000);
        }
    });
};

export const startProcessMonitor = (): void => {
    // 상태 머신 초기화
    stateMachine = new SurveillanceStateMachine((state: SurveillanceState) => {
        console.log(`[ProcessMonitor] Surveillance state: ${state}`);
    });
    
    startNativeProcess();
    app.on('will-quit', () => {
        if (nativeProcess) {
            console.log('[ProcessMonitor] Killing native monitor process on app quit');
            nativeProcess.kill();
        }
    });
};

// 최후의 변론 취소 (사용자가 응답함)
export const cancelFinalWarning = (): void => {
    if (stateMachine) {
        stateMachine.cancelFinalWarning();
    }
};

// 현재 감시 상태 가져오기
export const getSurveillanceState = (): SurveillanceState | null => {
    return stateMachine?.getState() || null;
};

// 최후의 변론 남은 시간 가져오기
export const getFinalWarningRemainingTime = (): number | null => {
    return stateMachine?.getFinalWarningRemainingTime() || null;
};