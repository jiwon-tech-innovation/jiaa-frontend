@echo off
REM Windows 네이티브 모니터 빌드 스크립트

setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0
set APP_DIR=%SCRIPT_DIR%..
set NATIVE_DIR=%APP_DIR%\src\native
set BUILD_DIR=%APP_DIR%\build\native

if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"

echo Building Windows native monitor...

REM MinGW 사용
where g++ >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo Using MinGW g++...
    g++ -o "%BUILD_DIR%\monitor_win.exe" ^
        "%NATIVE_DIR%\monitor_win.cpp" ^
        -lpsapi -luser32 -lole32 -loleaut32 ^
        -std=c++17
    if %ERRORLEVEL% == 0 (
        echo Windows monitor built: %BUILD_DIR%\monitor_win.exe
        exit /b 0
    )
)

REM MSVC 사용
where cl >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo Using MSVC cl...
    cl /EHsc /Fe:"%BUILD_DIR%\monitor_win.exe" ^
        "%NATIVE_DIR%\monitor_win.cpp" ^
        psapi.lib user32.lib ole32.lib oleaut32.lib
    if %ERRORLEVEL% == 0 (
        echo Windows monitor built: %BUILD_DIR%\monitor_win.exe
        exit /b 0
    )
)

echo ERROR: No C++ compiler found. Please install MinGW or MSVC.
exit /b 1

