import React, { useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { signout as signoutAction } from '../../store/slices/authSlice';
import { signout } from '../../services/api';
import { MainLayout } from '../../components/MainLayout/MainLayout';
import './setting.css';

const Setting: React.FC = () => {
    const [screenMode, setScreenMode] = useState<'light' | 'dark' | 'system'>('dark');
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const dispatch = useAppDispatch();

    const handleLogout = async () => {
        if (isLoggingOut) return;
        
        setIsLoggingOut(true);
        try {
            console.log('[Setting] Logging out...');
            await signout();
            dispatch(signoutAction());
            console.log('[Setting] Logout successful, redirecting to signin...');
            window.electronAPI?.openSignin();
        } catch (error) {
            console.error('[Setting] Logout error:', error);
            // 에러가 발생해도 로컬 토큰은 이미 삭제됨 (signout 함수에서 처리)
            dispatch(signoutAction());
            window.electronAPI?.openSignin();
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <MainLayout activeTab="setting">
            <div className="setting-container">
                <header className="header">
                    <h1>설정</h1>
                </header>
                <div className="setting-content">
                    <h2 className="setting-subtitle">화면 설정</h2>

                    {/* 화면 모드 섹션 */}
                    <div className="setting-section">
                        <label className="setting-label">화면모드</label>
                        <div className="mode-buttons">
                            <button
                                className={`mode-button ${screenMode === 'light' ? 'active' : ''}`}
                                onClick={() => setScreenMode('light')}
                            >
                                화이트 모드
                            </button>
                            <button
                                className={`mode-button ${screenMode === 'dark' ? 'active' : ''}`}
                                onClick={() => setScreenMode('dark')}
                            >
                                다크 모드
                            </button>
                            <button
                                className={`mode-button ${screenMode === 'system' ? 'active' : ''}`}
                                onClick={() => setScreenMode('system')}
                            >
                                시스템 설정
                            </button>
                        </div>
                    </div>

                    {/* 아바타 섹션 */}
                    <div className="setting-section">
                        <label className="setting-label">아바타</label>
                        <p className="setting-description">아바타에 대한 세부설명</p>
                    </div>

                    {/* 계정 섹션 */}
                    <h2 className="setting-subtitle">계정</h2>
                    <div className="setting-section">
                        <label className="setting-label">로그아웃</label>
                        <p className="setting-description">현재 계정에서 로그아웃합니다.</p>
                        <button 
                            className="logout-button"
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                        >
                            {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Setting;
