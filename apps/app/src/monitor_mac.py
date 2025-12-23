import AppKit
import Quartz
import json
import sys
import time
from Foundation import NSDate

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
    
    # 창 제목 가져오기 (AppleScript 활용 - 가장 안정적)
    script_src = f'tell application "System Events" to get name of window 1 of process "{app_name}"'
    title_script = AppKit.NSAppleScript.alloc().initWithSource_(script_src)
    title_res, _ = title_script.executeAndReturnError_(None)
    window_title = title_res.stringValue() if title_res else ""

    return {
        "idle_time": idle_time,
        "app_name": app_name,
        "window_title": window_title,
        "pid": active_app.processIdentifier() if active_app else 0
    }

if __name__ == "__main__":
    while True:
        try:
            print(json.dumps(get_mac_status(), ensure_ascii=False))
            sys.stdout.flush()
        except Exception as e:
            pass
        time.sleep(2)