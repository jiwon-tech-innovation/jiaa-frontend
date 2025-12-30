import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Sidebar, type SidebarItem } from '@repo/ui';
import { useAppDispatch } from '../../store/hooks';
import { signout as signoutAction } from '../../store/slices/authSlice';
import { signout, tryAutoLogin } from '../../services/api';
import { Live2DManager } from '../../managers/Live2DManager';
import { TitleBar } from '../TitleBar';
import './MainLayout.css';

export const MainLayout: React.FC = () => {
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isTokenReady, setIsTokenReady] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    // Determine active tab based on current path
    const getActiveTab = (): 'home' | 'dashboard' | 'group' | 'setting' | 'roadmap' | 'avatar' | 'profile' | 'chat' | null => {
        const path = location.pathname;
        if (path === '/profile') return 'profile';
        if (path === '/dashboard') return 'home';
        if (path.startsWith('/chat')) return 'chat';
        if (path === '/statistics') return 'dashboard';
        if (path.startsWith('/roadmap')) return 'roadmap';
        if (path === '/social') return 'group';
        if (path.startsWith('/avatar')) return 'avatar';
        if (path === '/setting') return 'setting';
        return 'home';
    };

    const activeTab = getActiveTab();
    const isProfileActive = activeTab === 'profile';

    // 대시보드(홈)에서만 아바타 표시
    const shouldShowAvatar = location.pathname === '/dashboard';
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dispatch = useAppDispatch();

    // 전역 자동 로그인 시도 (Cmd + Shift + R 등 하드 리로드 시 대응)
    useEffect(() => {
        const attemptAutoLogin = async () => {
            try {
                console.log('[MainLayout] Attempting auto-login...');
                const success = await tryAutoLogin();
                if (success) {
                    console.log('[MainLayout] Auto-login successful, tokens refreshed');
                } else {
                    console.log('[MainLayout] Auto-login failed or no refresh token');
                }
            } catch (error) {
                console.error('[MainLayout] Auto-login error:', error);
            } finally {
                setIsTokenReady(true);
            }
        };

        attemptAutoLogin();
    }, []);

    const handleSignout = async () => {
        try {
            console.log('[MainLayout] Logging out...');
            await signout(); // API 호출 및 토큰 삭제
            dispatch(signoutAction());
            console.log('[MainLayout] Logout successful, redirecting to signin...');
            navigate('/signin');
        } catch (error) {
            console.error('[MainLayout] Logout error:', error);
            // 에러가 발생해도 로컬 토큰은 이미 삭제됨
            dispatch(signoutAction());
            navigate('/signin');
        }
    };

    // Live2D Init - 아바타가 표시될 때만 초기화
    useEffect(() => {
        if (!shouldShowAvatar || !canvasRef.current) return;

        const initSidebarAvatar = async () => {
            if (!canvasRef.current) return;
            const manager = Live2DManager.getInstance();

            try {
                // Fetch user info for avatar
                const { getCurrentUser } = await import('../../services/api');
                const user = await getCurrentUser();
                const modelName = user.avatarId === 'default' ? 'robot' : user.avatarId;
                const modelUrl = user.avatarUrl;

                manager.initialize(canvasRef.current, modelName, modelUrl);
                manager.enableSync();
            } catch (err) {
                console.error('[MainLayout] Failed to initialize sidebar avatar:', err);
                // Fallback to 'robot' if failed to fetch user
                manager.initialize(canvasRef.current, 'robot');
                manager.enableSync();
            }
        };

        initSidebarAvatar();

        return () => {
            const manager = Live2DManager.getInstance();
            manager.disableSync();
        };
    }, [shouldShowAvatar]);

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
            icon: 'Home Icon 16px.svg',
            label: '홈',
            active: activeTab === 'home',
            onClick: () => navigate('/dashboard')
        },
        {
            id: 'chat',
            icon: 'Chat Icon 24px.svg',
            label: '채팅',
            active: activeTab === 'chat',
            onClick: () => navigate('/chat')
        },
        {
            id: 'dashboard',
            icon: 'DashBoard Icon 24px.svg',
            label: '대시보드',
            active: activeTab === 'dashboard',
            onClick: () => navigate('/statistics')
        },
        {
            id: 'roadmap',
            icon: 'Roadmap Icon 24px.svg',
            label: '로드맵',
            active: activeTab === 'roadmap',
            onClick: () => navigate('/roadmap-list')
        },
        {
            id: 'group',
            icon: 'Group Icon 24px.svg',
            label: '그룹',
            active: activeTab === 'group',
            onClick: () => navigate('/social')
        },
        {
            id: 'avatar',
            icon: 'Avartar Icon 36px.svg',
            label: '아바타',
            active: activeTab === 'avatar',
            onClick: () => navigate('/avatar-setting')
        },
        {
            id: 'setting',
            icon: 'Setting Icon 24px.svg',
            label: '설정',
            active: activeTab === 'setting',
            onClick: () => navigate('/setting')
        }
    ];

    return (
        <div className={`main-layout ${!shouldShowAvatar ? 'no-avatar' : ''}`}>
            <TitleBar />
            <Sidebar
                items={sidebarItems}
                isProfileDropdownOpen={isProfileDropdownOpen}
                isProfileActive={isProfileActive}
                onProfileClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                onSignout={handleSignout}
                onProfileDetail={() => navigate('/profile')}
            />

            <main className="main-content">
                <Outlet context={{ isTokenReady }} />
            </main>

            <div className={`avatar-sidebar-container ${!shouldShowAvatar ? 'hidden' : ''}`}>
                <canvas
                    ref={canvasRef}
                    id="live2d-sidebar-canvas"
                    onMouseMove={handleMouseMove}
                ></canvas>
            </div>
        </div>
    );
};
