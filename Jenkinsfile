pipeline {
    agent none
    
    parameters {
        choice(name: 'PLATFORM', 
               choices: ['all', 'macos', 'windows'], 
               description: '빌드할 플랫폼을 선택하세요')
        choice(name: 'ARCH', 
               choices: ['all', 'arm64', 'x64'], 
               description: '아키텍처를 선택하세요 (macOS만)')
    }
    
    stages {
        stage('Build Native Monitors') {
            parallel {
                stage('Build macOS Monitor') {
                    when {
                        anyOf {
                            params.PLATFORM == 'all'
                            params.PLATFORM == 'macos'
                        }
                    }
                    agent {
                        label 'macos' // macOS 에이전트 라벨
                    }
                    steps {
                        dir('apps/app') {
                            echo "Building macOS native monitor..."
                            sh '''
                                chmod +x scripts/build-native.sh
                                ./scripts/build-native.sh
                            '''
                            
                            // 빌드된 파일 확인
                            sh 'ls -lh build/native/monitor_mac || exit 1'
                            
                            // 아티팩트 저장
                            archiveArtifacts artifacts: 'build/native/monitor_mac', 
                                           fingerprint: true,
                                           allowEmptyArchive: false
                        }
                    }
                }
                
                stage('Build Windows Monitor') {
                    when {
                        anyOf {
                            params.PLATFORM == 'all'
                            params.PLATFORM == 'windows'
                        }
                    }
                    agent {
                        label 'windows' // Windows 에이전트 라벨
                    }
                    steps {
                        dir('apps/app') {
                            echo "Building Windows native monitor..."
                            
                            // Windows에서 빌드 스크립트 실행
                            bat '''
                                cd scripts
                                build-native.bat
                            '''
                            
                            // 빌드된 파일 확인
                            bat 'dir build\\native\\monitor_win.exe'
                            
                            // 아티팩트 저장
                            archiveArtifacts artifacts: 'build/native/monitor_win.exe', 
                                           fingerprint: true,
                                           allowEmptyArchive: false
                        }
                    }
                }
            }
        }
        
        stage('Build Electron App') {
            agent any
            steps {
                dir('apps/app') {
                    echo "Building Electron application..."
                    
                    // 의존성 설치
                    sh 'npm install -g pnpm'
                    sh 'pnpm install'
                    
                    // 네이티브 모니터 복사 (이전 단계에서 빌드된 것)
                    script {
                        // macOS 빌드된 파일이 있으면 복사
                        if (fileExists('build/native/monitor_mac')) {
                            echo "macOS monitor found"
                        }
                        
                        // Windows 빌드된 파일이 있으면 복사
                        if (fileExists('build/native/monitor_win.exe')) {
                            echo "Windows monitor found"
                        }
                    }
                    
                    // Electron 앱 빌드
                    sh 'pnpm run package'
                }
            }
        }
        
        stage('Package Electron App') {
            agent any
            steps {
                dir('apps/app') {
                    echo "Packaging Electron application..."
                    
                    script {
                        def platforms = []
                        if (params.PLATFORM == 'all' || params.PLATFORM == 'macos') {
                            if (params.ARCH == 'all' || params.ARCH == 'arm64') {
                                platforms.add('darwin:arm64')
                            }
                            if (params.ARCH == 'all' || params.ARCH == 'x64') {
                                platforms.add('darwin:x64')
                            }
                        }
                        if (params.PLATFORM == 'all' || params.PLATFORM == 'windows') {
                            platforms.add('win32:x64')
                        }
                        
                        platforms.each { platform ->
                            def parts = platform.split(':')
                            def os = parts[0]
                            def arch = parts[1]
                            
                            echo "Building for ${os} ${arch}..."
                            sh "pnpm run make:${os}-${arch}"
                        }
                    }
                }
            }
        }
        
        stage('Archive Artifacts') {
            agent any
            steps {
                dir('apps/app') {
                    echo "Archiving build artifacts..."
                    
                    // 빌드된 네이티브 모니터 아카이브
                    archiveArtifacts artifacts: 'build/native/**', 
                                   fingerprint: true,
                                   allowEmptyArchive: false
                    
                    // Electron 앱 패키지 아카이브
                    archiveArtifacts artifacts: 'out/**', 
                                   fingerprint: true,
                                   allowEmptyArchive: false
                }
            }
        }
    }
    
    post {
        success {
            echo "✅ Build completed successfully!"
        }
        failure {
            echo "❌ Build failed!"
        }
        always {
            // 빌드 결과 정리
            cleanWs()
        }
    }
}

