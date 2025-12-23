import { spawn, ChildProcess } from 'child_process';
import path from 'node:path';
import { app } from 'electron';

let pythonProcess: ChildProcess | null = null;

export const startProcessMonitor = (): void => {
    // Dev environment path adjustment
    // In dev, __dirname is likely .../.vite/build/
    // Source is .../src/main/main.js
    // monitor_processes.py is in src/
    let scriptPath = path.join(__dirname, '../../src/monitor_processes.py');

    // If __dirname includes .vite/build, we need to go up two levels to get to project root then into src
    if (__dirname.includes('.vite/build')) {
        scriptPath = path.join(__dirname, '../../src/monitor_processes.py');
    }

    pythonProcess = spawn('python3', [scriptPath]);

    console.log(`[Python] Spawning script at: ${scriptPath}`);

    if (pythonProcess.stdout) {
        pythonProcess.stdout.on('data', (data) => {
            try {
                const messages = data.toString().trim().split('\n');
                messages.forEach((msg: string) => {
                    if (!msg) return;
                    const event = JSON.parse(msg);
                    if (event.event === 'new_process') {
                        console.log(`[Python] New Process Detected: ${event.name} (PID: ${event.pid})`);

                        // Focus Guard: 롤(League of Legends) 감지 시 자동 종료
                        const distractionNames = ['LeagueClient', 'League of Legends', 'LoL'];
                        // 대소문자 구분 없이 포함 여부 확인 (Mac process names can vary)
                        if (distractionNames.some(d => event.name.toLowerCase().includes(d.toLowerCase()))) {
                            console.log(`[Focus Guard] Distraction Detected: ${event.name} (PID: ${event.pid}). Terminating...`);
                            try {
                                process.kill(event.pid); // Terminate process
                                console.log('[Focus Guard] Process terminated successfully.');

                                // Optional: Show a balloon/notification? 
                                // For now just console log.
                            } catch (err: any) {
                                console.error(`[Focus Guard] Failed to terminate process: ${err.message}`);
                            }
                        }
                    }
                });
            } catch (e) {
                console.error('[Python] Parse Error:', e);
            }
        });
    }

    if (pythonProcess.stderr) {
        pythonProcess.stderr.on('data', (data) => {
            console.error(`[Python API]: ${data}`);
        });
    }

    app.on('will-quit', () => {
        if (pythonProcess) {
            pythonProcess.kill();
        }
    });
};
