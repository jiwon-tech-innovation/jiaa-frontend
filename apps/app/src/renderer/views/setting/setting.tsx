import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { signout } from '../../store/slices/authSlice';
import './setting.css';

const Setting: React.FC = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [screenMode, setScreenMode] = useState<'light' | 'dark' | 'system'>('dark');
    const dispatch = useAppDispatch();
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    const handleDashboard = () => {
        window.electronAPI?.openDashboard();
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleSignout = async () => {
        dispatch(signout());
        await window.electronAPI.deleteRefreshToken();
        window.electronAPI.closeDashboard();
    };

    return (
        <>
            <button className="close-btn" id="close-btn" onClick={() => window.electronAPI?.closeDashboard()}>&times;</button>
            <div className="dashboard-wrapper">
                <nav className="sidebar">
                    <div className="nav-item profile" onClick={toggleDropdown} ref={dropdownRef}>
                        <div className="profile-circle"></div>
                        {isDropdownOpen && (
                            <div className="dropdown-menu">
                                <div className="dropdown-item">내 프로필</div>
                                <div className="dropdown-item" onClick={handleSignout}>로그아웃</div>
                            </div>
                        )}
                    </div>
                    <div className="nav-group">
                        <div className="nav-item" onClick={handleDashboard}>
                            <img src="/Home Icon 16px.svg" alt="" />
                        </div>
                        <div className="nav-item">
                            <img src="/DashBoard Icon 24px.svg" alt="" />
                        </div>
                        <div className="nav-item">
                            <img src="/Group Icon 24px.svg" alt="" />
                        </div>
                        <div className="nav-item active">
                            <img src="/Setting Icon 24px.svg" alt="" />
                        </div>
                    </div>
                </nav>

                <div className="setting-container">
                    <h1 className="setting-page-title">설정</h1>
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
                    </div>
                </div>
            </div>
        </>
    );
};

export default Setting;