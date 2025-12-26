import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchContributionData, fetchDashboardStats, tryAutoLogin } from '../../services/api';
import { ContributionGraph } from '../../components/ContributionGraph';
import { MainLayout } from '../../components/MainLayout/MainLayout';
import { sendChatMessage, startRoadmapMode, parseRoadmapResponse, RoadmapResponse } from '../../services/chatApiService';
import './dashboard.css';

interface Message {
    id: number;
    text: string;
    timestamp: Date;
    sender: 'user' | 'ai';
}

const Dashboard: React.FC = () => {
    const [selectedYear, setSelectedYear] = useState(2025);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isTokenReady, setIsTokenReady] = useState(false);
    const [roadmapSessionId, setRoadmapSessionId] = useState<string | null>(null);
    const [roadmapData, setRoadmapData] = useState<RoadmapResponse | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 앱 시작 시 자동 로그인 시도 (토큰이 없을 경우)
    useEffect(() => {
        const attemptAutoLogin = async () => {
            try {
                const success = await tryAutoLogin();
                if (success) {
                    console.log('[Dashboard] Auto-login successful, tokens refreshed');
                } else {
                    console.log('[Dashboard] Auto-login failed or no refresh token');
                }
            } catch (error) {
                console.error('[Dashboard] Auto-login error:', error);
            } finally {
                // 토큰 준비 완료 (성공/실패 여부와 관계없이)
                setIsTokenReady(true);
            }
        };

        attemptAutoLogin();
    }, []);

    // Fetch Dashboard Stats (토큰 준비 완료 후 실행)
    const { data: radarData = [] } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: fetchDashboardStats,
        enabled: isTokenReady, // 토큰 준비 완료 후에만 실행
        staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    });

    // Calculate hexagon points for radar chart
    const calculateRadarPoints = (centerX: number, centerY: number, radius: number, values: number[]) => {
        const points = values.map((value, index) => {
            const angle = (Math.PI / 3) * index - Math.PI / 2; // 60 degrees apart, starting from top
            const r = (value / 100) * radius;
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        });
        return points.join(' ');
    };

    // Generate grid hexagon points
    const generateGridHexagon = (centerX: number, centerY: number, radius: number) => {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
        }
        return points.join(' ');
    };

    // Calculate label positions
    const getLabelPosition = (centerX: number, centerY: number, radius: number, index: number) => {
        const angle = (Math.PI / 3) * index - Math.PI / 2;
        const labelRadius = radius + 15;
        const x = centerX + labelRadius * Math.cos(angle);
        const y = centerY + labelRadius * Math.sin(angle);
        return { x: x.toFixed(1), y: y.toFixed(1) };
    };

    // Fetch Contribution Data
    const { data: contributionLevels = [] } = useQuery({
        queryKey: ['contributionData', selectedYear],
        queryFn: () => fetchContributionData(selectedYear)
    });

    const handleOpenRoadmap = () => {
        window.location.href = '../roadmap_list/roadmap_list.html';
    };

    const handleOpenStatistics = () => {
        window.location.href = '../statistics/statistics.html';
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() && !isLoading && roadmapSessionId) {
            const userMessage: Message = {
                id: Date.now(),
                text: inputValue,
                timestamp: new Date(),
                sender: 'user'
            };

            setMessages(prev => [...prev, userMessage]);
            setInputValue('');
            setIsLoading(true);

            try {
                const response = await sendChatMessage(inputValue, roadmapSessionId);

                if (response.error) {
                    console.error('AI 응답 오류:', response.error);
                    return;
                }

                const aiResponseText = response.response || '';

                // JSON 로드맵 응답인지 확인
                const roadmap = parseRoadmapResponse(aiResponseText);
                if (roadmap) {
                    setRoadmapData(roadmap);
                    console.log('[Dashboard] 로드맵 생성 완료:', roadmap);
                    
                    // 로드맵 생성 완료 메시지 표시
                    const successMessage: Message = {
                        id: Date.now() + 1,
                        text: '로드맵이 성공적으로 생성되었습니다!',
                        timestamp: new Date(),
                        sender: 'ai'
                    };
                    setMessages(prev => [...prev, successMessage]);
                    
                    // 2초 후 모달 닫기
                    setTimeout(() => {
                        handleCloseCreateModal();
                    }, 2000);
                } else {
                    // 일반 응답
                    const aiMessage: Message = {
                        id: Date.now() + 1,
                        text: aiResponseText,
                        timestamp: new Date(),
                        sender: 'ai'
                    };
                    setMessages(prev => [...prev, aiMessage]);
                }
            } catch (error) {
                console.error('메시지 전송 오류:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleOpenCreateModal = async () => {
        setIsCreateModalOpen(true);
        setMessages([]);
        setInputValue('');
        setRoadmapData(null);
        
        // 로드맵 모드 시작
        try {
            const newSessionId = `roadmap-${Date.now()}`;
            const sessionIdResult = await startRoadmapMode(newSessionId);
            if (sessionIdResult) {
                setRoadmapSessionId(sessionIdResult);
                console.log('[Dashboard] 로드맵 모드 시작:', sessionIdResult);
            } else {
                console.error('[Dashboard] 로드맵 모드 시작 실패');
            }
        } catch (error) {
            console.error('[Dashboard] 로드맵 모드 시작 오류:', error);
        }
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
        setMessages([]);
        setInputValue('');
        setRoadmapSessionId(null);
        setRoadmapData(null);
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
                            <svg viewBox="0 0 200 200" className="radar-chart" preserveAspectRatio="xMidYMid meet">
                                {/* Background hexagon */}
                                <polygon points={generateGridHexagon(100, 100, 65)} className="radar-bg" />
                                {/* Grid lines - inner hexagons */}
                                <polygon points={generateGridHexagon(100, 100, 48)} className="radar-grid" />
                                <polygon points={generateGridHexagon(100, 100, 32)} className="radar-grid" />
                                <polygon points={generateGridHexagon(100, 100, 16)} className="radar-grid" />
                                {/* Data polygon */}
                                {radarData.length > 0 && (
                                    <polygon
                                        points={calculateRadarPoints(100, 100, 65, radarData.map(d => d.value))}
                                        className="radar-data"
                                    />
                                )}
                                {/* Labels */}
                                {radarData.map((item, index) => {
                                    const pos = getLabelPosition(100, 100, 65, index);
                                    return (
                                        <text
                                            key={index}
                                            x={pos.x}
                                            y={pos.y}
                                            textAnchor="middle"
                                            className="radar-label"
                                        >
                                            {item.label}
                                        </text>
                                    );
                                })}
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
                                <button className="create-btn" onClick={handleOpenCreateModal}>로드맵 생성</button>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Stats Panel */}
                    <div className="card bottom-card">
                        <div className="card-header">
                            <span>활동기록</span>
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

            {/* Create Roadmap Modal */}
            {isCreateModalOpen && (
                <div className="create-roadmap-modal-overlay" onClick={handleCloseCreateModal}>
                    <div className="create-roadmap-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="create-roadmap-modal-gradient">
                            <div className="gradient-blue"></div>
                            <div className="gradient-purple"></div>
                        </div>

                        {messages.length === 0 ? (
                            <div className="create-loadmap-text">
                                <p className="text-title">원하는 목표를 구체적으로 말씀해주세요</p>
                                <p>근육량을 3kg 늘리고 싶어</p>
                                <p>React를 공부하고 싶어</p>
                                <p>미적분을 공부하고 싶어</p>
                            </div>
                        ) : (
                            <div className="messages-container">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`message-item ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
                                    >
                                        <p className="message-text">{message.text}</p>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="message-item ai-message">
                                        <div className="message-text loading-message">
                                            <span className="loading-dot"></span>
                                            <span className="loading-dot"></span>
                                            <span className="loading-dot"></span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}

                        <form className="input-form" onSubmit={handleSubmit}>
                            <div className="input-wrapper">
                                <input
                                    type="text"
                                    className="loadmap-input"
                                    placeholder="원하는 목표를 구체적으로 말씀해주세요..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    disabled={isLoading || !roadmapSessionId}
                                />
                                <button
                                    type="submit"
                                    className="send-button"
                                    disabled={!inputValue.trim() || isLoading || !roadmapSessionId}
                                >
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default Dashboard;
