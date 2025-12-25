import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { Live2DManager } from '../../managers/Live2DManager';
import { signout } from '../../store/slices/authSlice';
import './profile.css';

const ProfileView: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dispatch = useAppDispatch();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const user = useAppSelector((state) => state.auth.user);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleSignout = async () => {
        dispatch(signout());
        await window.electronAPI.deleteRefreshToken();
        window.electronAPI.closeDashboard();
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

    const handleClose = () => {
        window.electronAPI?.closeDashboard();
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const manager = Live2DManager.getInstance();
        manager.onMouseMove(x, y);
    };

    const handleGoHome = () => {
        window.location.href = '../dashboard/dashboard.html';
    };

    return (
        <>
            <button className="close-btn" id="close-btn" onClick={handleClose}>&times;</button>
            <div className="dashboard-wrapper">
                {/* Sidebar */}
                <nav className="sidebar">
                    <div className="nav-item profile active" onClick={toggleDropdown} ref={dropdownRef}>
                        <div className="profile-circle"></div>
                        {isDropdownOpen && (
                            <div className="dropdown-menu">
                                <div className="dropdown-item">내 프로필</div>
                                <div className="dropdown-item" onClick={handleSignout}>로그아웃</div>
                            </div>
                        )}
                    </div>
                    <div className="nav-group">
                        <div className="nav-item" onClick={handleGoHome}>
                            <img src="/Home Icon 16px.svg" alt="" />
                        </div>
                    </div>
                </nav>

                <div className="profile-view-container">
                    <div className="profile-content">
                        <header className="profile-header">
                            <h1 className="profile-title">내 프로필</h1>
                        </header>

                        <div className="profile-card">
                            <div className="profile-avatar-large">
                                <div className="avatar-placeholder"></div>
                                <button className="edit-avatar-btn">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                            </div>

                            <div className="profile-info">
                                <div className="info-group">
                                    <label>이름</label>
                                    <div className="info-value">사용자</div>
                                </div>
                                <div className="info-group">
                                    <label>이메일</label>
                                    <div className="info-value">{user?.email || 'user@example.com'}</div>
                                </div>
                                <div className="info-group">
                                    <label>소개</label>
                                    <div className="info-value muted">자기소개를 입력해주세요.</div>
                                </div>
                            </div>

                            <div className="profile-actions">
                                <button className="btn-primary">프로필 수정</button>
                                <button className="btn-secondary" onClick={handleSignout}>로그아웃</button>
                            </div>
                        </div>

                        <div className="profile-stats-grid">
                            <div className="stat-card">
                                <span className="stat-label">진행 중인 로드맵</span>
                                <span className="stat-number">3</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">완료한 태스크</span>
                                <span className="stat-number">24</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-label">활동 일수</span>
                                <span className="stat-number">12일</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Avatar Canvas */}
                <div className="avatar-container">
                    <canvas ref={canvasRef} id="live2d-dashboard" onMouseMove={handleMouseMove}></canvas>
                </div>
            </div>
        </>
    );
};

export default ProfileView;
