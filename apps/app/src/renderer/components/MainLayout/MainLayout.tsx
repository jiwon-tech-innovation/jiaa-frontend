import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Sidebar, type SidebarItem } from '@repo/ui';
import { useAppDispatch } from '../../store/hooks';
import { signout as signoutAction } from '../../store/slices/authSlice';
import { signout } from '../../services/api';
import { Live2DManager } from '../../managers/Live2DManager';
import { TitleBar } from '../TitleBar';
import './MainLayout.css';

export const MainLayout: React.FC = () => {
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
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

        // Temporarily disabled for debugging
        const manager = Live2DManager.getInstance();
        manager.initialize(canvasRef.current);
        manager.enableSync();

        return () => {
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
            icon: '/Home Icon 16px.svg',
            label: '홈',
            active: activeTab === 'home',
            onClick: () => navigate('/dashboard')
        },
        {
            id: 'chat',
            icon: '/Chat Icon 24px.svg',
            label: '채팅',
            active: activeTab === 'chat',
            onClick: () => navigate('/chat')
        },
        {
            id: 'dashboard',
            icon: '/DashBoard Icon 24px.svg',
            label: '대시보드',
            active: activeTab === 'dashboard',
            onClick: () => navigate('/statistics')
        },
        {
            id: 'roadmap',
            icon: '/Roadmap Icon 24px.svg',
            label: '로드맵',
            active: activeTab === 'roadmap',
            onClick: () => navigate('/roadmap-list')
        },
        {
            id: 'group',
            icon: '/Group Icon 24px.svg',
            label: '그룹',
            active: activeTab === 'group',
            onClick: () => navigate('/social')
        },
        {
            id: 'avatar',
            icon: '/Avartar Icon 36px.svg',
            label: '아바타',
            active: activeTab === 'avatar',
            onClick: () => navigate('/avatar-setting')
        },
        {
            id: 'setting',
            icon: '/Setting Icon 24px.svg',
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
                <Outlet />
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
