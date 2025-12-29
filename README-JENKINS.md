# Jenkins 배포 가이드

## 요구사항

### Jenkins 에이전트 설정
1. **macOS 에이전트** (라벨: `macos`)
   - macOS 머신에 Jenkins 에이전트 설치
   - Swift 컴파일러 필요
   - Xcode Command Line Tools 설치

2. **Windows 에이전트** (라벨: `windows`)
   - Windows 머신에 Jenkins 에이전트 설치
   - MinGW 또는 MSVC 컴파일러 필요

### AWS EC2 인스턴스 권장 사양
- **macOS 빌드용**: macOS EC2 인스턴스 (Mac1 인스턴스 타입)
- **Windows 빌드용**: Windows EC2 인스턴스

## Jenkins 설정

### 1. 에이전트 라벨 설정
Jenkins 관리 → 노드 관리에서:
- macOS 에이전트: 라벨 `macos` 추가
- Windows 에이전트: 라벨 `windows` 추가

### 2. 파이프라인 사용
프로젝트 생성 시 "Pipeline" 선택하고 `Jenkinsfile` 경로 지정:
```
electron-app/Jenkinsfile
```

### 3. 빌드 파라미터
- `PLATFORM`: `all`, `macos`, `windows` 중 선택
- `ARCH`: `all`, `arm64`, `x64` 중 선택 (macOS만)

## 대안: GitHub Actions 사용

Jenkins에 macOS/Windows 에이전트가 없다면 GitHub Actions를 사용하는 것을 권장합니다:

```yaml
# .github/workflows/build.yml
name: Build Native Monitors

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build macOS Monitor
        run: |
          cd electron-app/apps/app
          chmod +x scripts/build-native.sh
          ./scripts/build-native.sh
  
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Windows Monitor
        run: |
          cd electron-app/apps/app/scripts
          build-native.bat
```

## 대안 2: 사전 빌드된 바이너리 포함

네이티브 모니터를 Git 저장소에 포함하는 방법:
1. 로컬에서 빌드
2. `build/native/` 디렉토리를 Git에 커밋
3. Jenkins에서는 빌드 스킵

단점: 바이너리 파일 크기가 큼

## 대안 3: Docker를 통한 크로스 컴파일 (복잡)

Docker를 사용한 크로스 컴파일은 Swift/C++의 경우 매우 복잡하므로 권장하지 않습니다.

