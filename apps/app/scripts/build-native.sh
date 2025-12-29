#!/bin/bash

# 네이티브 모니터 빌드 스크립트

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
NATIVE_DIR="$APP_DIR/src/native"
BUILD_DIR="$APP_DIR/build/native"

mkdir -p "$BUILD_DIR"

# macOS 빌드
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Building macOS native monitor..."
    swiftc -o "$BUILD_DIR/monitor_mac" \
        "$NATIVE_DIR/monitor_mac.swift" \
        -framework Foundation \
        -framework AppKit \
        -framework CoreGraphics \
        -framework ApplicationServices
    
    chmod +x "$BUILD_DIR/monitor_mac"
    echo "macOS monitor built: $BUILD_DIR/monitor_mac"
fi

# Windows 빌드 (WSL 또는 Windows에서 실행)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
    echo "Building Windows native monitor..."
    # MinGW 또는 MSVC 사용
    if command -v g++ &> /dev/null; then
        g++ -o "$BUILD_DIR/monitor_win.exe" \
            "$NATIVE_DIR/monitor_win.cpp" \
            -lpsapi -luser32 -lole32 -loleaut32 \
            -std=c++17
        echo "Windows monitor built: $BUILD_DIR/monitor_win.exe"
    elif command -v cl &> /dev/null; then
        cl /EHsc /Fe:"$BUILD_DIR/monitor_win.exe" \
            "$NATIVE_DIR/monitor_win.cpp" \
            psapi.lib user32.lib ole32.lib oleaut32.lib
        echo "Windows monitor built: $BUILD_DIR/monitor_win.exe"
    else
        echo "Warning: No C++ compiler found for Windows. Install MinGW or MSVC."
    fi
fi

echo "Native monitor build complete!"

