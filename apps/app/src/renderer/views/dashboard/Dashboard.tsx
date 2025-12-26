import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchContributionData } from '../../services/api';
import { ContributionGraph } from '../../components/ContributionGraph';
import { MainLayout } from '../../components/MainLayout/MainLayout';
import { sendMessageToBedrock } from '../../services/bedrockService';
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
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
        if (inputValue.trim() && !isLoading) {
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
                const response = await sendMessageToBedrock(inputValue);

                if (response.error) {
                    console.error('AI 응답 오류:', response.error);
                    return;
                }

                const aiMessage: Message = {
                    id: Date.now() + 1,
                    text: response.content,
                    timestamp: new Date(),
                    sender: 'ai'
                };

                setMessages(prev => [...prev, aiMessage]);
            } catch (error) {
                console.error('메시지 전송 오류:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleOpenCreateModal = () => {
        setIsCreateModalOpen(true);
        setMessages([]);
        setInputValue('');
    };

    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
        setMessages([]);
        setInputValue('');
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
                                <button className="create-btn" onClick={handleOpenCreateModal}>로드맵 생성</button>
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
                                    placeholder="로드맵 이름을 입력하세요..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="send-button"
                                    disabled={!inputValue.trim() || isLoading}
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
