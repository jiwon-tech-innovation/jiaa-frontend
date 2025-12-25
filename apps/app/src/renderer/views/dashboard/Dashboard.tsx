import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchContributionData } from '../../services/api';
import { ContributionGraph } from '../../components/ContributionGraph';
import { MainLayout } from '../../components/MainLayout/MainLayout';
import './dashboard.css';

const Dashboard: React.FC = () => {
    const [selectedYear, setSelectedYear] = useState(2025);

    // Fetch Contribution Data
    const { data: contributionLevels = [] } = useQuery({
        queryKey: ['contributionData', selectedYear],
        queryFn: () => fetchContributionData(selectedYear)
    });

    const handleOpenRoadmap = () => {
        window.location.href = '../roadmap/roadmap.html';
    };

    const handleOpenStatistics = () => {
        window.location.href = '../statistics/statistics.html';
    };

    return (
        <MainLayout activeTab="home">
            <div className="dashboard-container">
                <header className="header">
                    <h1>홈</h1>
                </header>

                <div className="dashboard-grid">
                    {/* Radar Chart Panel */}
                    <div className="card radar-card">
                        <div className="card-header">
                            <span>대시보드</span>
                            <span className="more" onClick={handleOpenStatistics} style={{ cursor: 'pointer' }}>자세히 보기</span>
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
                            <div className="roadmap-footer">
                                <button className="create-btn" onClick={() => alert('로드맵 생성 기능 준비 중입니다.')}>로드맵 생성</button>
                            </div>
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
                                <div className="streak-info">12일 연속 🔥</div>
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
        </MainLayout>
    );
};

export default Dashboard;
