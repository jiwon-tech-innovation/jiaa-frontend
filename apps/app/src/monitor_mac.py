import AppKit
import Quartz
import json
import sys
import time
import os
import signal
import subprocess
from Foundation import NSDate
from datetime import datetime

def get_process_name(active_app):
    """프로세스 이름 가져오기"""
    try:
        if active_app:
            # bundleIdentifier 또는 executableURL에서 프로세스 이름 추출
            bundle_id = active_app.bundleIdentifier()
            if bundle_id:
                # bundle ID에서 마지막 부분만 추출 (예: com.riotgames.LeagueofLegends -> leagueoflegends)
                process_name = bundle_id.split('.')[-1].lower()
                print(f"[DEBUG] Process name from bundle: {process_name} (bundle_id: {bundle_id})", file=sys.stderr)
                return process_name
            # executableURL에서도 시도
            exec_url = active_app.executableURL()
            if exec_url:
                process_name = os.path.basename(str(exec_url)).lower()
                print(f"[DEBUG] Process name from exec URL: {process_name}", file=sys.stderr)
                return process_name
    except Exception as e:
        print(f"[DEBUG] Error getting process name: {e}", file=sys.stderr)
    return ""

def is_league_running(process_name):
    """롤(League of Legends) 실행 여부 확인 - 프로세스 이름만 체크"""
    # 롤 관련 프로세스 이름 키워드
    league_keywords = [
        "league", "lol", "riot", 
        "leagueoflegends", "riotclient",
        "league of legends", "riot client"
    ]
    process_lower = process_name.lower()
    
    print(f"[DEBUG] Checking League by process name: '{process_name}'", file=sys.stderr)
    
    for keyword in league_keywords:
        if keyword in process_lower:
            print(f"[DEBUG] League detected! Matched process_name: '{process_name}' (keyword: '{keyword}')", file=sys.stderr)
            return True
    
    return False

def get_mac_status():
    # 1. 물리적 생존 확인 (마지막 입력 이후 경과 시간)
    # kCGAnyInputEventType = ~0 (모든 입력)
    idle_time = Quartz.CGEventSourceSecondsSinceLastEventType(
        Quartz.kCGEventSourceStateCombinedSessionState, 
        Quartz.kCGAnyInputEventType
    )

    # 2. 문맥 확인 (활성화된 앱 및 창 제목)
    workspace = AppKit.NSWorkspace.sharedWorkspace()
    active_app = workspace.frontmostApplication()
    app_name = active_app.localizedName() if active_app else "Unknown"
    process_name = get_process_name(active_app)
    
    # 창 제목 가져오기 (AppleScript 활용 - 가장 안정적)
    script_src = f'tell application "System Events" to get name of window 1 of process "{app_name}"'
    title_script = AppKit.NSAppleScript.alloc().initWithSource_(script_src)
    title_res, _ = title_script.executeAndReturnError_(None)
    window_title = title_res.stringValue() if title_res else ""

    # 롤 감지 시 프로세스 종료
    if is_league_running(process_name):
        pid = active_app.processIdentifier() if active_app else 0
        if pid > 0:
            try:
                print(f"[DEBUG] League detected - Killing process PID: {pid} at {datetime.now()}", file=sys.stderr)
                # macOS에서 앱 종료 (안전한 방법)
                running_app = AppKit.NSRunningApplication.runningApplicationWithProcessIdentifier_(pid)
                if running_app:
                    running_app.terminate()
                    # 강제 종료가 필요한 경우 (3초 후)
                    time.sleep(3)
                    if running_app.isFinished() == False:
                        print(f"[DEBUG] Process not terminated, force killing PID: {pid}", file=sys.stderr)
                        running_app.forceTerminate()
                else:
                    # NSRunningApplication이 실패하면 os.kill 사용
                    print(f"[DEBUG] Using os.kill for PID: {pid}", file=sys.stderr)
                    os.kill(pid, signal.SIGTERM)
                    time.sleep(1)
                    # 프로세스가 여전히 실행 중이면 강제 종료
                    try:
                        os.kill(pid, 0)  # 프로세스 존재 확인
                        os.kill(pid, signal.SIGKILL)
                        print(f"[DEBUG] Force killed PID: {pid}", file=sys.stderr)
                    except ProcessLookupError:
                        pass  # 이미 종료됨
            except Exception as e:
                print(f"[DEBUG] Error killing process PID {pid}: {e}", file=sys.stderr)
        
        # 모든 롤 관련 프로세스 찾아서 종료
        try:
            print(f"[DEBUG] Searching for all League-related processes...", file=sys.stderr)
            # ps 명령어로 모든 롤 관련 프로세스 찾기
            result = subprocess.run(
                ['pgrep', '-f', 'league|riot|lol'],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                pids = result.stdout.strip().split('\n')
                for pid_str in pids:
                    if pid_str:
                        try:
                            kill_pid = int(pid_str)
                            if kill_pid != os.getpid():  # 자기 자신은 제외
                                print(f"[DEBUG] Killing League-related process PID: {kill_pid}", file=sys.stderr)
                                os.kill(kill_pid, signal.SIGTERM)
                        except (ValueError, ProcessLookupError, PermissionError) as e:
                            print(f"[DEBUG] Could not kill PID {pid_str}: {e}", file=sys.stderr)
        except Exception as e:
            print(f"[DEBUG] Error searching for League processes: {e}", file=sys.stderr)
        
        print(f"[DEBUG] League process termination attempted - Exiting monitor script", file=sys.stderr)
        sys.exit(0)

    return {
        "idle_time": idle_time,
        "app_name": app_name,
        "window_title": window_title,
        "pid": active_app.processIdentifier() if active_app else 0
    }

if __name__ == "__main__":
    print(f"[DEBUG] macOS Monitor started at {datetime.now()}", file=sys.stderr)
    while True:
        try:
            status = get_mac_status()
            print(json.dumps(status, ensure_ascii=False))
            sys.stdout.flush()
        except Exception as e:
            print(f"[DEBUG] Error in main loop: {e}", file=sys.stderr)
        time.sleep(2)