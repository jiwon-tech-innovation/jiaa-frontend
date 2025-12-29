import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatService, { ChatMessage } from '../../services/ChatService';
import chatHistoryService, { ChatSession } from '../../services/ChatHistoryService';
import './chat.css';

const ChatView: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [session, setSession] = useState<ChatSession | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatService = ChatService.getInstance();

    useEffect(() => {
        if (!sessionId) {
            navigate('/chat');
            return;
        }

        // 세션 로드
        const loadedSession = chatHistoryService.getSession(sessionId);
        if (!loadedSession) {
            // 세션이 없으면 새로 생성
            const newSession = chatHistoryService.createSession();
            navigate(`/chat/${newSession.id}`, { replace: true });
            return;
        }

        setSession(loadedSession);
        setMessages(loadedSession.messages);

        // ChatService 연결 및 메시지 핸들러 설정
        chatService.connect();

        // 서버 세션 ID 연결
        const unsubscribeSessionId = chatService.onSessionIdChange((serverSessionId) => {
            if (sessionId) {
                chatHistoryService.setServerSessionId(sessionId, serverSessionId);
            }
        });

        const unsubscribeMessage = chatService.onMessage((message) => {
            // 메시지를 세션에 추가
            if (sessionId) {
                // 스트리밍 중인 메시지는 업데이트, 완료된 메시지는 추가
                if (message.isStreaming) {
                    // 스트리밍 중인 메시지 업데이트
                    setMessages(prev => {
                        const existingIndex = prev.findIndex(m => m.id === message.id);
                        if (existingIndex >= 0) {
                            // 기존 메시지 업데이트
                            const updated = [...prev];
                            updated[existingIndex] = message;
                            return updated;
                        } else {
                            // 새 메시지 추가
                            return [...prev, message];
                        }
                    });
                } else {
                    // 완료된 메시지 저장 (서버에도 저장)
                    chatHistoryService.addMessage(sessionId, message).catch(error => {
                        console.warn('[ChatView] Failed to save message:', error);
                    });
                    
                    // 로컬 상태 업데이트
                    setMessages(prev => {
                        const existingIndex = prev.findIndex(m => m.id === message.id);
                        if (existingIndex >= 0) {
                            // 기존 메시지 업데이트 (스트리밍 완료)
                            const updated = [...prev];
                            updated[existingIndex] = message;
                            return updated;
                        } else {
                            // 새 메시지 추가
                            return [...prev, message];
                        }
                    });
                    
                    // AI 응답이 완료되면 로딩 상태 해제
                    if (message.role === 'assistant') {
                        setIsLoading(false);
                    }
                }
            }
        });

        return () => {
            unsubscribeMessage();
            unsubscribeSessionId();
        };
    }, [sessionId, navigate]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading || !sessionId) return;

        const userMessage = chatService.sendMessage(inputValue);
        
        // 사용자 메시지를 세션에 추가 (서버에도 저장)
        chatHistoryService.addMessage(sessionId, userMessage).catch(error => {
            console.warn('[ChatView] Failed to save user message:', error);
        });
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);
    };

    const handleBack = () => {
        navigate('/chat');
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!session) {
        return (
            <div className="chat-view-container">
                <div className="chat-loading">로딩 중...</div>
            </div>
        );
    }

    return (
        <div className="chat-view-container">
            <header className="chat-view-header">
                <button className="back-button" onClick={handleBack}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <h1 className="chat-view-title">{session.title}</h1>
            </header>

            <div className="chat-messages-container">
                {messages.length === 0 ? (
                    <div className="chat-empty-state">
                        <div className="empty-icon">💬</div>
                        <p>대화를 시작해보세요!</p>
                    </div>
                ) : (
                    <div className="chat-messages-list">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`chat-message ${message.role === 'user' ? 'user-message' : 'ai-message'}`}
                            >
                                <div className="message-content">
                                    <p className="message-text">{message.content}</p>
                                </div>
                                    <span className="message-time">{formatTime(message.timestamp)}</span>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="chat-message ai-message">
                                <div className="message-content">
                                    <div className="message-text loading-message">
                                        <span className="loading-dot"></span>
                                        <span className="loading-dot"></span>
                                        <span className="loading-dot"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <form className="chat-input-form" onSubmit={handleSubmit}>
                <div className="chat-input-wrapper">
                    <input
                        type="text"
                        className="chat-input-field"
                        placeholder="메시지를 입력하세요..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className="chat-send-button"
                        disabled={!inputValue.trim() || isLoading}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatView;

