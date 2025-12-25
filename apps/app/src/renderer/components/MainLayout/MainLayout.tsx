import React, { useEffect, useRef, useState } from 'react';
import { Sidebar, type SidebarItem } from '@repo/ui';
import { useAppDispatch } from '../../store/hooks';
import { signout as signoutAction } from '../../store/slices/authSlice';
import { signout } from '../../services/api';
import { Live2DManager } from '../../managers/Live2DManager';
import './MainLayout.css';

interface MainLayoutProps {
    children: React.ReactNode;
    activeTab: 'home' | 'dashboard' | 'group' | 'setting' | 'roadmap';
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, activeTab }) => {
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
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

    const navigate = (path: string) => {
        window.location.href = path;
    };

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
                navigate('../roadmap/roadmap.html');
            }
        },
        {
            id: 'group',
            icon: '/Group Icon 24px.svg',
            label: '그룹',
            active: activeTab === 'group',
            onClick: () => { }
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
            <Sidebar
                items={sidebarItems}
                isProfileDropdownOpen={isProfileDropdownOpen}
                onProfileClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                onSignout={handleSignout}
                onProfileDetail={() => { }}
            />

            <main className="main-content">
                <button className="global-close-btn" onClick={handleClose}>&times;</button>
                {children}
            </main>

            <div className="avatar-sidebar-container">
                <canvas
                    ref={canvasRef}
                    id="live2d-sidebar-canvas"
                    onMouseMove={handleMouseMove}
                ></canvas>
            </div>
        </div>
    );
};
