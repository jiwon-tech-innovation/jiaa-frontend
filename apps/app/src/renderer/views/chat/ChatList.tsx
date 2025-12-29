import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import chatHistoryService, { ChatSession } from '../../services/ChatHistoryService';
import './chat.css';

const ChatList: React.FC = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSessions();
        
        // 창이 포커스를 받을 때 세션 목록 새로고침
        const handleFocus = () => {
            loadSessions();
        };
        
        window.addEventListener('focus', handleFocus);
        
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const loadSessions = () => {
        setIsLoading(true);
        const allSessions = chatHistoryService.getAllSessions();
        setSessions(allSessions);
        setIsLoading(false);
    };

    const handleNewChat = () => {
        const newSession = chatHistoryService.createSession();
        navigate(`/chat/${newSession.id}`);
    };

    const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (window.confirm('이 대화를 삭제하시겠습니까?')) {
            chatHistoryService.deleteSession(sessionId);
            loadSessions();
        }
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours === 0) {
                const minutes = Math.floor(diff / (1000 * 60));
                return minutes <= 0 ? '방금 전' : `${minutes}분 전`;
            }
            return `${hours}시간 전`;
        } else if (days === 1) {
            return '어제';
        } else if (days < 7) {
            return `${days}일 전`;
        } else {
            return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        }
    };

    return (
        <div className="chat-list-container">
            <header className="chat-list-header">
                <h1>대화 내역</h1>
                <button className="new-chat-button" onClick={handleNewChat}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    새 대화
                </button>
            </header>

            <div className="chat-list-content">
                {isLoading ? (
                    <div className="chat-list-loading">로딩 중...</div>
                ) : sessions.length === 0 ? (
                    <div className="chat-list-empty">
                        <div className="empty-icon">💬</div>
                        <p>아직 대화 내역이 없습니다.</p>
                        <button className="new-chat-button" onClick={handleNewChat}>
                            새 대화 시작하기
                        </button>
                    </div>
                ) : (
                    <div className="chat-sessions-list">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                className="chat-session-item"
                                onClick={() => navigate(`/chat/${session.id}`)}
                            >
                                <div className="session-content">
                                    <h3 className="session-title">{session.title}</h3>
                                    <p className="session-preview">
                                        {session.messages.length > 0
                                            ? session.messages[session.messages.length - 1].content.substring(0, 50) + '...'
                                            : '빈 대화'}
                                    </p>
                                    <span className="session-date">{formatDate(session.updatedAt)}</span>
                                </div>
                                <button
                                    className="session-delete-button"
                                    onClick={(e) => handleDeleteSession(e, session.id)}
                                    title="삭제"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatList;

