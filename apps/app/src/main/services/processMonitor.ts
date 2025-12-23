import { spawn, ChildProcess } from 'child_process';
import path from 'node:path';
import os from 'os';
import { app } from 'electron';

let pythonProcess: ChildProcess | null = null;

export const startProcessMonitor = (): void => {
    const isWin = os.platform() === 'win32';
    const scriptName = isWin ? 'monitor_win.py' : 'monitor_mac.py';
    const pythonCmd = isWin ? 'python' : 'python3';

    let scriptPath = path.join(__dirname, '../../src', scriptName);
    if (__dirname.includes('.vite/build')) {
        scriptPath = path.join(__dirname, '../../src', scriptName);
    }

    pythonProcess = spawn(pythonCmd, [scriptPath]);

    pythonProcess.stdout?.on('data', async (data) => {
        const lines = data.toString().trim().split('\n');
        for (const line of lines) {
            try {
                const status = JSON.parse(line);
                if (status.event !== 'status_update') continue;

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
                const distractions = ['League', 'LoL'];
                if (distractions.some(d => status.window_title?.includes(d))) {
                    process.kill(status.pid);
                }

            } catch (e) { console.error("Parse Error"); }
        }
    });

    app.on('will-quit', () => pythonProcess?.kill());
};