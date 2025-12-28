import React, { useState, useRef, useEffect, useCallback } from 'react';
import ChatService, { ChatMessage, ConnectionStatus } from '../../services/ChatService';
import './chat.css';

export type ChatMode = 'chat' | 'roadmap';

interface ChatUIProps {
    /** WebSocket 서버 URL (선택사항 - 없으면 로컬 모드) */
    websocketUrl?: string;
    /** 말풍선 표시 시간 (ms) - 기본값 5000ms */
    bubbleDuration?: number;
    /** 채팅 모드: 'chat' (기본) 또는 'roadmap' (오늘 로드맵 질문) */
    chatMode?: ChatMode;
    /** 오늘 로드맵 컨텍스트 (질문 모드에서 사용) */
    todayRoadmapContext?: string;
    /** 모드 변경 콜백 */
    onModeChange?: (mode: ChatMode) => void;
}

const ChatUI: React.FC<ChatUIProps> = ({
    websocketUrl,
    bubbleDuration = 5000,
    chatMode = 'chat',
    todayRoadmapContext,
    onModeChange
}) => {
    const [inputValue, setInputValue] = useState('');
    const [isInputVisible, setIsInputVisible] = useState(false);
    const [currentBubble, setCurrentBubble] = useState<ChatMessage | null>(null);
    const [bubbleUpdateKey, setBubbleUpdateKey] = useState(0); // 강제 리렌더링을 위한 key
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const inputRef = useRef<HTMLInputElement>(null);
    const bubbleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const streamingMessageIdRef = useRef<string | null>(null); // 스트리밍 중인 메시지 ID 추적
    const chatService = useRef(ChatService.getInstance());

    // 말풍선 표시
    const showBubble = useCallback((message: ChatMessage) => {
        // 스트리밍 중인 메시지는 즉시 업데이트 (같은 메시지 ID로 계속 업데이트)
        if (message.isStreaming) {
            // 스트리밍 시작 시 ID 저장
            if (!streamingMessageIdRef.current) {
                streamingMessageIdRef.current = message.id;
            }

            // 즉시 상태 업데이트 - 스트리밍 메시지는 실시간으로 표시되어야 함
            setCurrentBubble(prev => {
                // 같은 메시지 ID면 내용만 업데이트, 아니면 새 메시지로 설정
                if (prev && prev.id === message.id) {
                    return {
                        ...prev,
                        content: message.content,
                    };
                }
                return {
                    id: message.id,
                    role: message.role,
                    content: message.content,
                    timestamp: message.timestamp,
                    isStreaming: true,
                };
            });

            // 스트리밍 중에는 타이머를 설정하지 않음
            return;
        }

        // 스트리밍 완료
        if (streamingMessageIdRef.current && message.id === streamingMessageIdRef.current) {
            streamingMessageIdRef.current = null;
        }

        // 일반 메시지는 표시 후 일정 시간 후 숨김
        // 기존 타이머 정리
        if (bubbleTimeoutRef.current) {
            clearTimeout(bubbleTimeoutRef.current);
        }

        setCurrentBubble({
            ...message,
            isStreaming: false,
        });
        bubbleTimeoutRef.current = setTimeout(() => {
            setCurrentBubble(null);
        }, bubbleDuration);
    }, [bubbleDuration]);

    // WebSocket 연결 및 메시지 핸들러 설정
    useEffect(() => {
        const service = chatService.current;

        // 연결 상태 핸들러
        const unsubscribeStatus = service.onStatusChange((status) => {
            setConnectionStatus(status);
        });

        // 메시지 수신 핸들러
        const unsubscribeMessage = service.onMessage((message) => {
            console.log(`[ChatUI] Received message:`, message.isStreaming ? 'streaming' : 'complete', message.content.substring(0, 50));
            showBubble(message);
        });

        // WebSocket 연결 (URL이 제공된 경우)
        service.connect(websocketUrl);

        return () => {
            unsubscribeStatus();
            unsubscribeMessage();
        };
    }, [websocketUrl, showBubble]);

    // 입력창 토글 (단축키: Enter)
    const toggleInput = useCallback(() => {
        setIsInputVisible(prev => !prev);
    }, []);

    // 입력창이 열리면 포커스
    useEffect(() => {
        if (isInputVisible && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isInputVisible]);

    // 키보드 단축키 핸들러
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Tab 키로 모드 전환
            if (e.key === 'Tab' && !isInputVisible) {
                e.preventDefault();
                const newMode = chatMode === 'chat' ? 'roadmap' : 'chat';
                onModeChange?.(newMode);
            }
            // Enter 키로 입력창 토글 (입력창이 닫혀있을 때)
            if (e.key === 'Enter' && !isInputVisible) {
                e.preventDefault();
                toggleInput();
            }
            // Escape 키로 입력창 닫기
            if (e.key === 'Escape' && isInputVisible) {
                e.preventDefault();
                setIsInputVisible(false);
                setInputValue('');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isInputVisible, toggleInput, chatMode, onModeChange]);

    // Global Shortcut Listener (IPC)
    useEffect(() => {
        const api = window.electronAPI;
        if (api && api.onOpenChat) {
            const cleanup = api.onOpenChat(() => {
                setIsInputVisible(true);
                // Also force focus immediately just in case
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 0);
            });
            return cleanup;
        }
    }, []);

    // 메시지 전송
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!inputValue.trim()) return;

        // 로드맵 모드일 때 컨텍스트 추가
        let messageToSend = inputValue;
        if (chatMode === 'roadmap' && todayRoadmapContext) {
            messageToSend = `[오늘 로드맵 질문]\n${todayRoadmapContext}\n\n질문: ${inputValue}`;
        }

        const userMessage = chatService.current.sendMessage(messageToSend);

        // 사용자 메시지도 말풍선에 잠깐 표시 (원본 질문만)
        showBubble({
            ...userMessage,
            content: inputValue  // 원본 질문만 표시
        });

        setInputValue('');

        // 연속 대화를 위해 입력창 닫지 않음
        // setIsInputVisible(false);

        // 전송 후 입력창에 다시 포커스
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    // 입력 변경
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    // 입력창 상태에 따라 마우스 이벤트 무시 여부 설정 (Click-through)
    useEffect(() => {
        const api = window.electronAPI;
        if (api && api.setIgnoreMouseEvents) {
            if (isInputVisible) {
                // 입력창이 열려있으면 마우스 이벤트 받음
                api.setIgnoreMouseEvents(false);
            } else {
                // 입력창이 닫혀있으면 마우스 이벤트 무시 (투명, 클릭 통과)
                api.setIgnoreMouseEvents(true, { forward: true });
            }
        }
    }, [isInputVisible]);

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            if (bubbleTimeoutRef.current) {
                clearTimeout(bubbleTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="chat-container">
            {/* 말풍선 */}
            {currentBubble && (
                <div
                    className={`speech-bubble ${currentBubble.role}`}
                    key={`bubble-${currentBubble.id}-${bubbleUpdateKey}-${currentBubble.content.length}`}
                >
                    <div className="bubble-content">
                        {currentBubble.content}
                        {currentBubble.isStreaming && (
                            <span className="streaming-cursor">▋</span>
                        )}
                    </div>
                    <div className="bubble-tail" />
                </div>
            )}

            {/* 연결 상태 표시 (디버그용 - 필요시 표시) */}
            {/* <div className={`connection-status ${connectionStatus}`}>
                {connectionStatus === 'connected' ? '🟢' : connectionStatus === 'connecting' ? '🟡' : '🔴'}
            </div> */}

            {/* 입력창 */}
            <div className={`chat-input-container ${isInputVisible ? 'visible' : ''}`}>
                <form onSubmit={handleSubmit}>
                    <input
                        ref={inputRef}
                        type="text"
                        className="chat-input"
                        placeholder="메시지를 입력하세요... (ESC로 닫기)"
                        value={inputValue}
                        onChange={handleInputChange}
                        onBlur={() => {
                            // 포커스를 잃으면 입력창 닫기 (약간의 딜레이 추가)
                            setTimeout(() => {
                                if (!inputValue.trim()) {
                                    setIsInputVisible(false);
                                }
                            }, 200);
                        }}
                    />
                    <button type="submit" className="chat-send-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" />
                        </svg>
                    </button>
                </form>
            </div>

            {/* 입력창 열기 힌트 */}
            {!isInputVisible && !currentBubble && (
                <div className="chat-hint-container">
                    {/* 모드 표시 */}
                    <div className={`mode-badge ${chatMode}`}>
                        {chatMode === 'chat' ? '💬 채팅 모드' : '📚 로드맵 질문 모드'}
                    </div>
                    <div className="chat-hint" onClick={toggleInput}>
                        <span>Enter로 대화 | Tab으로 모드 전환</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatUI;
