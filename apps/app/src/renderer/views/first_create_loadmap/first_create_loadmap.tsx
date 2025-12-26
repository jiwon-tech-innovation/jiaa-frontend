import React, { useState, useRef, useEffect } from "react";
import './first_create_loadmap.css';
import { sendChatMessage, startRoadmapMode, parseRoadmapResponse, RoadmapResponse } from '../../services/chatApiService';

interface Message {
    id: number;
    text: string;
    timestamp: Date;
    sender: 'user' | 'ai';
}

const FirstCreateLoadmap: React.FC = () => {
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [roadmapData, setRoadmapData] = useState<RoadmapResponse | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 컴포넌트 마운트 시 로드맵 모드 시작
    useEffect(() => {
        const initializeRoadmapMode = async () => {
            try {
                const newSessionId = `roadmap-${Date.now()}`;
                const sessionIdResult = await startRoadmapMode(newSessionId);
                if (sessionIdResult) {
                    setSessionId(sessionIdResult);
                    console.log('[Roadmap] 로드맵 모드 시작:', sessionIdResult);
                } else {
                    console.error('[Roadmap] 로드맵 모드 시작 실패');
                }
            } catch (error) {
                console.error('[Roadmap] 로드맵 모드 시작 오류:', error);
            }
        };

        initializeRoadmapMode();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() && !isLoading && sessionId) {
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
                const response = await sendChatMessage(inputValue, sessionId);

                if (response.error) {
                    throw new Error(response.error);
                }

                const aiResponseText = response.response || '';

                // JSON 로드맵 응답인지 확인
                const roadmap = parseRoadmapResponse(aiResponseText);
                if (roadmap) {
                    setRoadmapData(roadmap);
                    console.log('[Roadmap] 로드맵 생성 완료:', roadmap);
                    
                    // "생성이 완료되었습니다" 메시지 표시 후 대시보드로 이동
                    setTimeout(() => {
                        if (window.electronAPI && window.electronAPI.openDashboard) {
                            window.electronAPI.openDashboard();
                        } else {
                            // fallback: 직접 URL 이동
                            window.location.href = '../dashboard/dashboard.html';
                        }
                    }, 2000); // 2초 후 이동
                }

                const aiMessage: Message = {
                    id: Date.now() + 1,
                    text: aiResponseText,
                    timestamp: new Date(),
                    sender: 'ai'
                };

                setMessages(prev => [...prev, aiMessage]);
            } catch (error) {
                console.error('[Roadmap] 메시지 전송 오류:', error);
                const errorMessage: Message = {
                    id: Date.now() + 1,
                    text: '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.',
                    timestamp: new Date(),
                    sender: 'ai'
                };
                setMessages(prev => [...prev, errorMessage]);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="create-loadmap-container">
            <div className="gradient-overlay">
                <div className="gradient-blue"></div>
                <div className="gradient-purple"></div>
            </div>

            {roadmapData ? (
                <div className="roadmap-result-container">
                    <div className="roadmap-completion-message">
                        <h2 className="completion-title">생성이 완료되었습니다</h2>
                        <div className="completion-spinner">
                            <div className="spinner"></div>
                        </div>
                        <p className="completion-text">대시보드로 이동 중...</p>
                    </div>
                </div>
            ) : messages.length === 0 ? (
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
            
            {!roadmapData && (
                <form className="input-form" onSubmit={handleSubmit}>
                    <div className="input-wrapper">
                        <input
                            type="text"
                            className="loadmap-input"
                            placeholder="로드맵 이름을 입력하세요..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={!sessionId || isLoading}
                        />
                        <button
                            type="submit"
                            className="send-button"
                            disabled={!inputValue.trim() || isLoading || !sessionId}
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
            )}
        </div>
    );
};

export default FirstCreateLoadmap;