import { spawn, ChildProcess } from 'child_process';
import path from 'node:path';
import os from 'os';
import { app } from 'electron';

let pythonProcess: ChildProcess | null = null;
let isRestarting = false;

const startPythonProcess = (): void => {
    if (isRestarting) return;
    
    const isWin = os.platform() === 'win32';
    const scriptName = isWin ? 'monitor_win.py' : 'monitor_mac.py';
    const pythonCmd = isWin ? 'python' : 'python3';

    let scriptPath = path.join(__dirname, '../../src', scriptName);
    if (__dirname.includes('.vite/build')) {
        scriptPath = path.join(__dirname, '../../src', scriptName);
    }

    console.log(`[ProcessMonitor] Starting Python process: ${pythonCmd} ${scriptPath}`);
    pythonProcess = spawn(pythonCmd, [scriptPath]);

    // stdout 핸들러 - JSON 데이터 처리
    pythonProcess.stdout?.on('data', async (data) => {
        const lines = data.toString().trim().split('\n');
        for (const line of lines) {
            if (!line.trim()) continue;
            
            try {
                const status = JSON.parse(line);
                
                // event 필드가 없으면 그냥 처리 (Python 스크립트는 event 필드를 출력하지 않음)
                // if (status.event && status.event !== 'status_update') continue;

                // [1~2단계] 생존 확인 (10분 부재 및 오디오 없음)
                if (status.idle_time > 600 && !status.audio_playing) {
                    console.log("주인님 실종 감지... 4단계 최후의 변론 진입");
                    continue;
                }

                // [3단계] AI 판결 (창 제목 분석)
                if (status.window_title) {
                    // Bedrock 연동 함수 호출 (예시)
                    // const verdict = await askAI(status.window_title);
                    // if (verdict === 'STOP') process.kill(status.pid);
                }

                // [Focus Guard] 롤 감지 (기존 기능 유지)
                // Python 스크립트에서 이미 종료하므로 여기서는 추가 처리 불필요
                // const distractions = ['League', 'LoL'];
                // if (distractions.some(d => status.window_title?.includes(d))) {
                //     process.kill(status.pid);
                // }

            } catch (e) { 
                // JSON이 아닌 경우 무시 (디버그 로그 등)
                // console.error("[ProcessMonitor] Parse Error:", e, "Line:", line);
            }
        }
    });

    // stderr 핸들러 - 디버깅 로그 출력
    pythonProcess.stderr?.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        for (const line of lines) {
            if (line.trim()) {
                console.log(`[Python DEBUG] ${line}`);
            }
        }
    });

    // 프로세스 종료 핸들러
    pythonProcess.on('exit', (code, signal) => {
        console.log(`[ProcessMonitor] Python process exited with code ${code}, signal ${signal}`);
        
        // 롤 감지로 정상 종료된 경우 (code 0) 재시작하지 않음
        if (code === 0) {
            console.log('[ProcessMonitor] Python process exited normally (likely League detected)');
            pythonProcess = null;
            return;
        }
        
        // 비정상 종료된 경우 재시작
        if (!isRestarting) {
            console.log('[ProcessMonitor] Python process crashed, restarting in 2 seconds...');
            isRestarting = true;
            setTimeout(() => {
                isRestarting = false;
                startPythonProcess();
            }, 2000);
        }
    });

    // 에러 핸들러
    pythonProcess.on('error', (error) => {
        console.error('[ProcessMonitor] Python process error:', error);
        if (!isRestarting) {
            isRestarting = true;
            setTimeout(() => {
                isRestarting = false;
                startPythonProcess();
            }, 2000);
        }
    });
};

export const startProcessMonitor = (): void => {
    startPythonProcess();
    app.on('will-quit', () => {
        if (pythonProcess) {
            console.log('[ProcessMonitor] Killing Python process on app quit');
            pythonProcess.kill();
        }
    });
};