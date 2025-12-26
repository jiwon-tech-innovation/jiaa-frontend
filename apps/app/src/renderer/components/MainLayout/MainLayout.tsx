import React, { useEffect, useRef, useState } from 'react';
import { Sidebar, type SidebarItem } from '@repo/ui';
import { useAppDispatch } from '../../store/hooks';
import { signout as signoutAction } from '../../store/slices/authSlice';
import { signout } from '../../services/api';
import { Live2DManager } from '../../managers/Live2DManager';
import './MainLayout.css';

interface MainLayoutProps {
    children: React.ReactNode;
    activeTab: 'home' | 'dashboard' | 'group' | 'setting' | 'roadmap' | 'avatar';
    hideAvatar?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, activeTab, hideAvatar = false }) => {
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dispatch = useAppDispatch();

    const handleSignout = async () => {
        try {
            console.log('[MainLayout] Logging out...');
            await signout(); // API 호출 및 토큰 삭제
            dispatch(signoutAction());
            console.log('[MainLayout] Logout successful, redirecting to signin...');
            // 로그인 페이지로 이동 (아바타 모드가 아님)
            window.electronAPI.openSignin();
        } catch (error) {
            console.error('[MainLayout] Logout error:', error);
            // 에러가 발생해도 로컬 토큰은 이미 삭제됨
            dispatch(signoutAction());
            window.electronAPI.openSignin();
        }
    };

    const handleClose = () => {
        window.electronAPI?.closeDashboard();
    };

    const handleMinimize = () => {
        window.electronAPI?.minimize();
    };

    const handleMaximizeToggle = async () => {
        if (isMaximized) {
            window.electronAPI?.unmaximize();
        } else {
            window.electronAPI?.maximize();
        }
        const state = await window.electronAPI?.isMaximized();
        setIsMaximized(state);
    };

    const navigate = (path: string) => {
        window.location.href = path;
    };

    // Track window maximized state
    useEffect(() => {
        const checkMaximized = async () => {
            const state = await window.electronAPI?.isMaximized();
            setIsMaximized(state);
        };

        window.addEventListener('resize', checkMaximized);
        checkMaximized();

        return () => window.removeEventListener('resize', checkMaximized);
    }, []);

    // Live2D Init
    useEffect(() => {
        if (!canvasRef.current) return;

        const init = async () => {
            if (!canvasRef.current) return;
            const manager = Live2DManager.getInstance();
            manager.initialize(canvasRef.current);
            manager.enableSync();
        };

        init();

        return () => {
            const manager = Live2DManager.getInstance();
            manager.disableSync();
            Live2DManager.releaseInstance();
        };
    }, []);

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const manager = Live2DManager.getInstance();
        manager.onMouseMove(x, y);
    };

    const sidebarItems: SidebarItem[] = [
        {
            id: 'home',
            icon: '/Home Icon 16px.svg',
            label: '홈',
            active: activeTab === 'home',
            onClick: () => {
                navigate('../dashboard/dashboard.html');
            }
        },
        {
            id: 'roadmap',
            icon: '/DashBoard Icon 24px.svg',
            label: '로드맵',
            active: activeTab === 'roadmap',
            onClick: () => {
                navigate('../roadmap_list/roadmap_list.html');
            }
        },
        {
            id: 'group',
            icon: '/Group Icon 24px.svg',
            label: '그룹',
            active: activeTab === 'group',
            onClick: () => {
                navigate('../social/social.html');
            }
        },
        {
            id: 'avatar',
            icon: '/Avartar Icon 36px.svg',
            label: '아바타',
            active: activeTab === 'avatar',
            onClick: () => {
                window.electronAPI?.openAvatarSetting();
            }
        },
        {
            id: 'setting',
            icon: '/Setting Icon 24px.svg',
            label: '설정',
            active: activeTab === 'setting',
            onClick: () => {
                window.electronAPI?.openSetting();
            }
        }
    ];

    return (
        <div className="main-layout">
            <div className="title-bar-drag-area"></div>
            <Sidebar
                items={sidebarItems}
                isProfileDropdownOpen={isProfileDropdownOpen}
                onProfileClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                onSignout={handleSignout}
                onProfileDetail={() => {
                    window.electronAPI?.openProfile();
                }}
            />

            <main className="main-content">
                <div className="window-controls">
                    <button className="win-btn minimize-btn" onClick={handleMinimize} title="최소화">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                    <button className="win-btn maximize-btn" onClick={handleMaximizeToggle} title={isMaximized ? "이전 크기로" : "최대화"}>
                        {isMaximized ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
                            </svg>
                        ) : (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            </svg>
                        )}
                    </button>
                    <button className="win-btn close-btn" onClick={handleClose} title="닫기">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                {children}
            </main>

            {!hideAvatar && (
                <div className="avatar-sidebar-container">
                    <canvas
                        ref={canvasRef}
                        id="live2d-sidebar-canvas"
                        onMouseMove={handleMouseMove}
                    ></canvas>
                </div>
            )}
        </div>
    );
};
