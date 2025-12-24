import win32gui
import win32api
import win32process
import json
import sys
import time
from pycaw.pycaw import AudioUtilities

def is_audio_playing():
    # 2. 청각적 생존 확인 (오디오 세션 상태 체크)
    sessions = AudioUtilities.GetAllSessions()
    for session in sessions:
        if session.State == 1:  # 1 = AudioSessionStateActive
            return True
    return False

def get_win_status():
    # 1. 물리적 생존 확인
    last_input_ms = win32api.GetLastInputInfo()
    idle_time = (win32api.GetTickCount() - last_input_ms) / 1000.0

    # 2. 문맥 확인 (창 제목 및 프로세스명)
    hwnd = win32gui.GetForegroundWindow()
    window_title = win32gui.GetWindowText(hwnd)
    _, pid = win32process.GetWindowThreadProcessId(hwnd)

    return {
        "idle_time": idle_time,
        "window_title": window_title,
        "audio_playing": is_audio_playing(),
        "pid": pid
    }

if __name__ == "__main__":
    while True:
        try:
            print(json.dumps(get_win_status(), ensure_ascii=False))
            sys.stdout.flush()
        except Exception:
            pass
        time.sleep(2)