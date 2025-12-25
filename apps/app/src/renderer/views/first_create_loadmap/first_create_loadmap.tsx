import React, { useState, useRef, useEffect } from "react";
import './first_create_loadmap.css';
import { sendMessageToBedrock } from '../../services/bedrockService';

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
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
                // AWS Bedrock API 호출 (현재는 Mock)
                const response = await sendMessageToBedrock(inputValue);

                if (response.error) {
                    console.error('AI 응답 오류:', response.error);
                    // 에러 메시지를 AI 응답으로 표시할 수도 있습니다
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

    return (
        <div className="create-loadmap-container">
            <div className="gradient-overlay">
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
    );
};

export default FirstCreateLoadmap;