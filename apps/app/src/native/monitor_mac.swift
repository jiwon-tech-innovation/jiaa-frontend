#!/usr/bin/env swift

import Foundation
import AppKit
import CoreGraphics

// 상태 정보 구조체
struct MonitorStatus {
    let idle_time: Double
    let app_name: String
    let window_title: String
    let pid: Int32
    let audio_playing: Bool
    let process_name: String  // 프로세스 이름 추가 (AI 판단용)
}

// 프로세스 이름 가져오기
func getProcessName(_ activeApp: NSRunningApplication?) -> String {
    guard let app = activeApp else { return "" }
    
    if let bundleId = app.bundleIdentifier {
        // bundle ID에서 마지막 부분만 추출
        let processName = bundleId.split(separator: ".").last?.lowercased() ?? ""
        fputs("[DEBUG] Process name from bundle: \(processName) (bundle_id: \(bundleId))\n", stderr)
        return processName
    }
    
    if let execURL = app.executableURL {
        let processName = execURL.lastPathComponent.lowercased()
        fputs("[DEBUG] Process name from exec URL: \(processName)\n", stderr)
        return processName
    }
    
    return ""
}

// 게임 감지는 AI 판사 서비스에서 처리하므로 제거됨

// 오디오 재생 중인지 확인
func isAudioPlaying() -> Bool {
    // macOS에서 오디오 재생 확인
    // 방법 1: 시스템 볼륨 확인 (볼륨이 0이 아니면 오디오 시스템 활성화로 간주)
    let osascriptTask = Process()
    osascriptTask.launchPath = "/usr/bin/osascript"
    osascriptTask.arguments = ["-e", "output volume of (get volume settings)"]
    
    let osaPipe = Pipe()
    osascriptTask.standardOutput = osaPipe
    osascriptTask.launch()
    osascriptTask.waitUntilExit()
    
    if osascriptTask.terminationStatus == 0 {
        let data = osaPipe.fileHandleForReading.readDataToEndOfFile()
        if let output = String(data: data, encoding: .utf8) {
            let volume = Int(output.trimmingCharacters(in: .whitespacesAndNewlines)) ?? 0
            // 볼륨이 0이 아니면 오디오 시스템이 활성화된 것으로 간주
            // 실제로는 더 정교한 방법이 필요하지만, 간단한 구현으로 충분
            if volume > 0 {
                return true
            }
        }
    }
    
    // 방법 2: 오디오 재생 중인 프로세스 확인 (예: QuickTime, Spotify, Chrome 등)
    let pgrepTask = Process()
    pgrepTask.launchPath = "/usr/bin/pgrep"
    pgrepTask.arguments = ["-fl", "coreaudiod|AudioToolbox"]
    
    let pgrepPipe = Pipe()
    pgrepTask.standardOutput = pgrepPipe
    pgrepTask.launch()
    pgrepTask.waitUntilExit()
    
    if pgrepTask.terminationStatus == 0 {
        let data = pgrepPipe.fileHandleForReading.readDataToEndOfFile()
        if let output = String(data: data, encoding: .utf8) {
            // coreaudiod가 실행 중이면 오디오 시스템이 활성화된 것으로 간주
            if !output.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                return true
            }
        }
    }
    
    return false
}

// 게임 프로세스 종료는 Electron에서 처리

// macOS 상태 가져오기
func getMacStatus() -> MonitorStatus? {
    // 1. 물리적 생존 확인 (마지막 입력 이후 경과 시간)
    // 키보드와 마우스 이벤트를 모두 체크하고 최소값 사용
    let keyboardIdle = CGEventSource.secondsSinceLastEventType(
        .combinedSessionState,
        eventType: .keyDown
    )
    let mouseIdle = CGEventSource.secondsSinceLastEventType(
        .combinedSessionState,
        eventType: .leftMouseDown
    )
    let idleTime = min(keyboardIdle, mouseIdle)
    
    // 2. 오디오 재생 확인
    let audioPlaying = isAudioPlaying()
    
    // 3. 문맥 확인 (활성화된 앱 및 창 제목)
    let workspace = NSWorkspace.shared
    guard let activeApp = workspace.frontmostApplication else {
        return MonitorStatus(
            idle_time: idleTime,
            app_name: "Unknown",
            window_title: "",
            pid: 0,
            audio_playing: audioPlaying,
            process_name: ""
        )
    }
    
    let appName = activeApp.localizedName ?? "Unknown"
    let processName = getProcessName(activeApp)
    let pid = activeApp.processIdentifier
    
    // 창 제목 가져오기 (AppleScript 활용)
    var windowTitle = ""
    let scriptSource = """
        tell application "System Events"
            try
                get name of window 1 of process "\(appName)"
            on error
                return ""
            end try
        end tell
    """
    if let script = NSAppleScript(source: scriptSource) {
        var error: NSDictionary?
        let result = script.executeAndReturnError(&error)
        if error == nil {
            windowTitle = result.stringValue ?? ""
        }
    }
    
    // 게임 감지는 Electron에서 AI 판사 서비스를 통해 처리
    return MonitorStatus(
        idle_time: idleTime,
        app_name: appName,
        window_title: windowTitle,
        pid: pid,
        audio_playing: audioPlaying,
        process_name: processName
    )
}

// JSON 이스케이프
func escapeJson(_ str: String) -> String {
    return str
        .replacingOccurrences(of: "\\", with: "\\\\")
        .replacingOccurrences(of: "\"", with: "\\\"")
        .replacingOccurrences(of: "\n", with: "\\n")
        .replacingOccurrences(of: "\r", with: "\\r")
        .replacingOccurrences(of: "\t", with: "\\t")
}

// 메인 루프
func main() {
    let dateFormatter = DateFormatter()
    dateFormatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
    let now = dateFormatter.string(from: Date())
    fputs("[DEBUG] macOS Monitor started at \(now)\n", stderr)
    
    while true {
        if let status = getMacStatus() {
            // JSON을 직접 생성하여 Python과 동일한 형식으로 출력
            var json = "{"
            json += "\"idle_time\":\(status.idle_time),"
            json += "\"app_name\":\"\(escapeJson(status.app_name))\","
            json += "\"window_title\":\"\(escapeJson(status.window_title))\","
            json += "\"pid\":\(status.pid),"
            json += "\"audio_playing\":\(status.audio_playing ? 1 : 0),"
            json += "\"process_name\":\"\(escapeJson(status.process_name))\""
            json += "}"
            print(json)
            fflush(stdout)
        }
        
        Thread.sleep(forTimeInterval: 2.0)
    }
}

main()

