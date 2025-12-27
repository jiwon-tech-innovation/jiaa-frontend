import win32gui
import win32api
import win32process
import win32con
import json
import sys
import time
import os
import subprocess
from pycaw.pycaw import AudioUtilities
from datetime import datetime

def is_audio_playing():
    # 2. 청각적 생존 확인 (오디오 세션 상태 체크)
    sessions = AudioUtilities.GetAllSessions()
    for session in sessions:
        if session.State == 1:  # 1 = AudioSessionStateActive
            return True
    return False

def get_process_name(pid):
    """PID로부터 프로세스 이름 가져오기"""
    try:
        handle = win32api.OpenProcess(win32con.PROCESS_QUERY_INFORMATION | win32con.PROCESS_VM_READ, False, pid)
        if handle:
            process_path = win32process.GetModuleFileNameEx(handle, 0)
            win32api.CloseHandle(handle)
            # 경로에서 실행 파일 이름만 추출
            process_name = os.path.basename(process_path).lower()
            print(f"[DEBUG] Process name: {process_name} (PID: {pid}, Path: {process_path})", file=sys.stderr)
            return process_name
    except Exception as e:
        print(f"[DEBUG] Error getting process name for PID {pid}: {e}", file=sys.stderr)
    return ""

def is_league_running(process_name):
    """롤(League of Legends) 실행 여부 확인 - 프로세스 이름만 체크"""
    # 롤 관련 프로세스 이름 키워드
    league_keywords = [
        "league", "lol", "riot",
        "leagueoflegends", "riotclient",
        "league of legends.exe", "riot client.exe",
        "riotclientservices.exe", "leagueclient.exe"
    ]
    process_lower = process_name.lower()
    
    print(f"[DEBUG] Checking League by process name: '{process_name}'", file=sys.stderr)
    
    for keyword in league_keywords:
        if keyword in process_lower:
            print(f"[DEBUG] League detected! Matched process_name: '{process_name}' (keyword: '{keyword}')", file=sys.stderr)
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
    process_name = get_process_name(pid)

    # 롤 감지 시 프로세스 종료
    if is_league_running(process_name):
        try:
            print(f"[DEBUG] League detected - Killing process PID: {pid} at {datetime.now()}", file=sys.stderr)
            # Windows에서 프로세스 종료
            handle = win32api.OpenProcess(win32con.PROCESS_TERMINATE, False, pid)
            if handle:
                win32api.TerminateProcess(handle, 0)
                win32api.CloseHandle(handle)
                print(f"[DEBUG] Process PID {pid} terminated", file=sys.stderr)
        except Exception as e:
            print(f"[DEBUG] Error killing process PID {pid}: {e}", file=sys.stderr)
        
        # 모든 롤 관련 프로세스 찾아서 종료
        try:
            print(f"[DEBUG] Searching for all League-related processes...", file=sys.stderr)
            # tasklist로 모든 롤 관련 프로세스 찾기
            result = subprocess.run(
                ['tasklist', '/FI', 'IMAGENAME eq League*.exe', '/FI', 'IMAGENAME eq Riot*.exe', '/FO', 'CSV'],
                capture_output=True,
                text=True
            )
            # 또는 wmic 사용
            result2 = subprocess.run(
                ['wmic', 'process', 'where', "name like '%league%' or name like '%riot%' or name like '%lol%'", 'get', 'processid'],
                capture_output=True,
                text=True
            )
            if result2.returncode == 0:
                lines = result2.stdout.strip().split('\n')
                for line in lines[1:]:  # 첫 줄은 헤더
                    if line.strip() and line.strip().isdigit():
                        try:
                            kill_pid = int(line.strip())
                            if kill_pid != os.getpid():  # 자기 자신은 제외
                                print(f"[DEBUG] Killing League-related process PID: {kill_pid}", file=sys.stderr)
                                handle = win32api.OpenProcess(win32con.PROCESS_TERMINATE, False, kill_pid)
                                if handle:
                                    win32api.TerminateProcess(handle, 0)
                                    win32api.CloseHandle(handle)
                        except (ValueError, Exception) as e:
                            print(f"[DEBUG] Could not kill PID {line.strip()}: {e}", file=sys.stderr)
        except Exception as e:
            print(f"[DEBUG] Error searching for League processes: {e}", file=sys.stderr)
        
        print(f"[DEBUG] League process termination attempted - Exiting monitor script", file=sys.stderr)
        sys.exit(0)

    return {
        "idle_time": idle_time,
        "window_title": window_title,
        "audio_playing": is_audio_playing(),
        "pid": pid
    }

if __name__ == "__main__":
    print(f"[DEBUG] Windows Monitor started at {datetime.now()}", file=sys.stderr)
    while True:
        try:
            status = get_win_status()
            print(json.dumps(status, ensure_ascii=False))
            sys.stdout.flush()
        except Exception as e:
            print(f"[DEBUG] Error in main loop: {e}", file=sys.stderr)
        time.sleep(2)