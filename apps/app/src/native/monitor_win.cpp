#include <windows.h>
#include <psapi.h>
#include <tlhelp32.h>
#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <iomanip>
#include <ctime>
#include <comdef.h>
#include <mmdeviceapi.h>
#include <audiopolicy.h>
#include <functiondiscoverykeys_devpkey.h>

#pragma comment(lib, "psapi.lib")
#pragma comment(lib, "user32.lib")
#pragma comment(lib, "ole32.lib")
#pragma comment(lib, "oleaut32.lib")

// JSON 출력을 위한 간단한 헬퍼
class JsonBuilder {
private:
    std::ostringstream ss;
    bool first = true;
    
public:
    void add(const std::string& key, const std::string& value) {
        if (!first) ss << ",";
        ss << "\"" << key << "\":\"" << escape(value) << "\"";
        first = false;
    }
    
    void add(const std::string& key, double value) {
        if (!first) ss << ",";
        ss << "\"" << key << "\":" << value;
        first = false;
    }
    
    void add(const std::string& key, int value) {
        if (!first) ss << ",";
        ss << "\"" << key << "\":" << value;
        first = false;
    }
    
    std::string build() {
        return "{" + ss.str() + "}";
    }
    
private:
    std::string escape(const std::string& str) {
        std::ostringstream o;
        for (char c : str) {
            if (c == '"') o << "\\\"";
            else if (c == '\\') o << "\\\\";
            else if (c == '\n') o << "\\n";
            else if (c == '\r') o << "\\r";
            else if (c == '\t') o << "\\t";
            else o << c;
        }
        return o.str();
    }
};

// 프로세스 이름 가져오기
std::string GetProcessName(DWORD pid) {
    HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, pid);
    if (!hProcess) {
        std::cerr << "[DEBUG] Error opening process PID " << pid << std::endl;
        return "";
    }
    
    char processPath[MAX_PATH];
    if (GetModuleFileNameExA(hProcess, NULL, processPath, MAX_PATH)) {
        CloseHandle(hProcess);
        std::string path(processPath);
        size_t pos = path.find_last_of("\\/");
        std::string name = (pos != std::string::npos) ? path.substr(pos + 1) : path;
        std::transform(name.begin(), name.end(), name.begin(), ::tolower);
        std::cerr << "[DEBUG] Process name: " << name << " (PID: " << pid << ", Path: " << processPath << ")" << std::endl;
        return name;
    }
    
    CloseHandle(hProcess);
    return "";
}

// 게임 감지는 AI 판사 서비스에서 처리하므로 제거됨

// 오디오 재생 중인지 확인
bool IsAudioPlaying() {
    HRESULT hr = CoInitializeEx(NULL, COINIT_MULTITHREADED);
    if (FAILED(hr)) return false;
    
    bool isPlaying = false;
    
    IMMDeviceEnumerator* pEnumerator = NULL;
    hr = CoCreateInstance(__uuidof(MMDeviceEnumerator), NULL, CLSCTX_ALL,
                          __uuidof(IMMDeviceEnumerator), (void**)&pEnumerator);
    
    if (SUCCEEDED(hr)) {
        IMMDevice* pDevice = NULL;
        hr = pEnumerator->GetDefaultAudioEndpoint(eRender, eConsole, &pDevice);
        
        if (SUCCEEDED(hr)) {
            ISimpleAudioVolume* pVolume = NULL;
            hr = pDevice->Activate(__uuidof(ISimpleAudioVolume), CLSCTX_ALL, NULL, (void**)&pVolume);
            
            if (SUCCEEDED(hr)) {
                IAudioSessionManager2* pManager = NULL;
                hr = pDevice->Activate(__uuidof(IAudioSessionManager2), CLSCTX_ALL, NULL, (void**)&pManager);
                
                if (SUCCEEDED(hr)) {
                    IAudioSessionEnumerator* pEnumerator = NULL;
                    hr = pManager->GetSessionEnumerator(&pEnumerator);
                    
                    if (SUCCEEDED(hr)) {
                        int count = 0;
                        pEnumerator->GetCount(&count);
                        
                        for (int i = 0; i < count; i++) {
                            IAudioSessionControl* pControl = NULL;
                            hr = pEnumerator->GetSession(i, &pControl);
                            
                            if (SUCCEEDED(hr)) {
                                IAudioSessionControl2* pControl2 = NULL;
                                hr = pControl->QueryInterface(__uuidof(IAudioSessionControl2), (void**)&pControl2);
                                
                                if (SUCCEEDED(hr)) {
                                    AudioSessionState state;
                                    hr = pControl2->GetState(&state);
                                    
                                    if (SUCCEEDED(hr) && state == AudioSessionStateActive) {
                                        isPlaying = true;
                                        pControl2->Release();
                                        break;
                                    }
                                    pControl2->Release();
                                }
                                pControl->Release();
                            }
                        }
                        pEnumerator->Release();
                    }
                    pManager->Release();
                }
                pVolume->Release();
            }
            pDevice->Release();
        }
        pEnumerator->Release();
    }
    
    CoUninitialize();
    return isPlaying;
}

// 프로세스 종료
void KillProcess(DWORD pid) {
    HANDLE hProcess = OpenProcess(PROCESS_TERMINATE, FALSE, pid);
    if (hProcess) {
        TerminateProcess(hProcess, 0);
        CloseHandle(hProcess);
        std::cerr << "[DEBUG] Process PID " << pid << " terminated" << std::endl;
    }
}

// 게임 프로세스 종료는 Electron에서 처리

// Windows 상태 가져오기
void GetWinStatus() {
    // 1. 물리적 생존 확인
    LASTINPUTINFO lii;
    lii.cbSize = sizeof(LASTINPUTINFO);
    GetLastInputInfo(&lii);
    
    DWORD currentTick = GetTickCount();
    double idleTime = (currentTick - lii.dwTime) / 1000.0;
    
    // 2. 문맥 확인 (창 제목 및 프로세스명)
    HWND hwnd = GetForegroundWindow();
    char windowTitle[256] = {0};
    GetWindowTextA(hwnd, windowTitle, sizeof(windowTitle));
    
    DWORD pid = 0;
    GetWindowThreadProcessId(hwnd, &pid);
    std::string processName = GetProcessName(pid);
    
    // 게임 감지는 Electron에서 AI 판사 서비스를 통해 처리
    
    // JSON 출력
    JsonBuilder json;
    json.add("idle_time", idleTime);
    json.add("window_title", std::string(windowTitle));
    json.add("audio_playing", IsAudioPlaying() ? 1 : 0);
    json.add("pid", (int)pid);
    json.add("process_name", processName);
    
    std::cout << json.build() << std::endl;
    std::cout.flush();
}

int main() {
    time_t now = time(0);
    struct tm timeinfo;
    localtime_s(&timeinfo, &now);
    char timeStr[64];
    strftime(timeStr, sizeof(timeStr), "%Y-%m-%d %H:%M:%S", &timeinfo);
    std::cerr << "[DEBUG] Windows Monitor started at " << timeStr << std::endl;
    
    while (true) {
        try {
            GetWinStatus();
        } catch (...) {
            std::cerr << "[DEBUG] Error in main loop" << std::endl;
        }
        
        Sleep(2000);
    }
    
    return 0;
}

