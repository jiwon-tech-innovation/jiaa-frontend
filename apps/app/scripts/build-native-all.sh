#!/bin/bash

# 모든 플랫폼 네이티브 모니터 빌드 스크립트 (CI/CD용)
# Jenkins나 GitHub Actions에서 사용

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
NATIVE_DIR="$APP_DIR/src/native"
BUILD_DIR="$APP_DIR/build/native"

mkdir -p "$BUILD_DIR"

PLATFORM=${1:-$(uname -s | tr '[:upper:]' '[:lower:]')}

echo "Building native monitor for platform: $PLATFORM"

case "$PLATFORM" in
    darwin|macos|macosx)
        echo "Building macOS native monitor..."
        swiftc -o "$BUILD_DIR/monitor_mac" \
            "$NATIVE_DIR/monitor_mac.swift" \
            -framework Foundation \
            -framework AppKit \
            -framework CoreGraphics \
            -framework ApplicationServices
        
        chmod +x "$BUILD_DIR/monitor_mac"
        echo "✅ macOS monitor built: $BUILD_DIR/monitor_mac"
        ;;
    
    linux)
        echo "⚠️  Linux is not supported for native monitor"
        exit 1
        ;;
    
    *)
        echo "⚠️  Unknown platform: $PLATFORM"
        exit 1
        ;;
esac

echo "✅ Native monitor build complete!"

