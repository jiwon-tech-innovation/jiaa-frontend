import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { Live2DManager } from '../../managers/Live2DManager';
import { signout } from '../../store/slices/authSlice';
import { useQuery } from '@tanstack/react-query';
import { fetchContributionData } from '../../services/api';
import { ContributionGraph } from '../../components/ContributionGraph';
import './dashboard.css';

const Dashboard: React.FC = () => {
    console.log('[Dashboard] Rendering Dashboard component');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedYear, setSelectedYear] = useState(2025);
    const dispatch = useAppDispatch();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch Contribution Data
    const { data: contributionLevels = [] } = useQuery({
        queryKey: ['contributionData', selectedYear],
        queryFn: () => fetchContributionData(selectedYear)
    });

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

            // Enable sync with other windows (Avatar)
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

    const handleOpenRoadmap = () => {
        window.location.href = '../roadmap/roadmap.html';
    };
    const handleSetting = () => {
        window.electronAPI?.openSetting();
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const manager = Live2DManager.getInstance();
        manager.onMouseMove(x, y);
    };

    return (
        <>
            <button className="close-btn" id="close-btn" onClick={handleClose}>&times;</button>
            <div className="dashboard-wrapper">
                {/* Sidebar */}
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
                        <div className="nav-item active">
                            <img src="/Home Icon 16px.svg" alt="" />
                        </div>
                        <div className="nav-item">
                            <img src="/DashBoard Icon 24px.svg" alt="" />
                        </div>
                        <div className="nav-item">
                            <img src="/Group Icon 24px.svg" alt="" />
                        </div>
                        <a id="signup-link" onClick={handleSetting} style={{ cursor: 'pointer' }}>
                            <div className="nav-item">
                                <img src="/Setting Icon 24px.svg" alt="" />
                            </div>
                        </a>
                    </div>
                </nav>

                <div className="dashboard-container">
                    <header className="header">
                        <h1>홈</h1>
                    </header>

                    <div className="dashboard-grid">
                        {/* Radar Chart Panel */}
                        <div className="card radar-card">
                            <div className="card-header">
                                <span>대시보드</span>
                                <span className="more">자세히 보기</span>
                            </div>
                            <div className="card-body">
                                <svg viewBox="0 0 200 200" className="radar-chart">
                                    <polygon points="100,20 169.3,60 169.3,140 100,180 30.7,140 30.7,60" className="radar-bg" />
                                    <polygon points="100,40 152,70 152,130 100,160 48,130 48,70" className="radar-grid" />
                                    <polygon points="100,60 134.6,80 134.6,120 100,140 65.4,120 65.4,80" className="radar-grid" />
                                    <polygon points="100,30 155,68 141,124 100,170 51,128 41,66" className="radar-data" />
                                    <text x="100" y="15" textAnchor="middle" className="radar-label">코딩</text>
                                    <text x="178" y="55" textAnchor="start" className="radar-label">운동</text>
                                    <text x="178" y="145" textAnchor="start" className="radar-label">수학</text>
                                    <text x="100" y="195" textAnchor="middle" className="radar-label">관리</text>
                                    <text x="22" y="145" textAnchor="end" className="radar-label">분석</text>
                                    <text x="22" y="55" textAnchor="end" className="radar-label">테스팅</text>
                                </svg>
                            </div>
                        </div>

                        {/* Roadmap Panel */}
                        <div className="card roadmap-card">
                            <div className="card-header">
                                <span>로드맵</span>
                                <span className="more" onClick={handleOpenRoadmap} style={{ cursor: 'pointer' }}>자세히 보기</span>
                            </div>
                            <div className="card-body">
                                <ul className="roadmap-list">
                                    <li className="roadmap-item completed">
                                        <span className="status-icon">✓</span>
                                        <span>기초 다지기</span>
                                    </li>
                                    <li className="roadmap-item active">
                                        <span className="status-icon">▶</span>
                                        <span>심화 학습</span>
                                    </li>
                                    <li className="roadmap-item">
                                        <span className="status-icon">○</span>
                                        <span>실전 프로젝트</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Bottom Stats Panel */}
                        <div className="card bottom-card">
                            <div className="card-header">
                                <span>활동기록</span>
                                <span className="more">자세히 보기</span>
                            </div>
                            <div className="card-body flex-row">
                                <div className="stat-box">
                                    <div className="stat-value">10/8</div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: '70%' }}></div>
                                    </div>
                                    <div className="progress-bar secondary">
                                        <div className="progress-fill" style={{ width: '40%' }}></div>
                                    </div>
                                </div>
                                <ContributionGraph
                                    data={contributionLevels}
                                    years={[2025, 2024, 2023, 2022]}
                                    selectedYear={selectedYear}
                                    onSelectYear={setSelectedYear}
                                />
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

export default Dashboard;