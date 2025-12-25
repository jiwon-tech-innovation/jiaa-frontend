'use client';

import { useEffect, useState } from 'react';
import './ChatDemo.css';

interface Message {
    id: number;
    type: 'user' | 'avatar';
    text: string;
    emotion?: string;
}

const demoMessages: Message[] = [
    { id: 1, type: 'user', text: '지아야, 오늘 일정 알려줘!' },
    { id: 2, type: 'avatar', text: '안녕! 오늘 오후 2시에 미팅이 있고, 저녁 7시에 운동 예약이 있어요! 🗓️', emotion: '😊' },
    { id: 3, type: 'user', text: '미팅 준비할 자료 정리해줘' },
    { id: 4, type: 'avatar', text: '물론이죠! 지난주 진행상황과 이번 주 목표를 정리해드릴게요 ✨', emotion: '🤗' },
    { id: 5, type: 'user', text: '고마워 지아!' },
    { id: 6, type: 'avatar', text: '언제든 불러주세요! 옆에서 항상 응원하고 있어요 💪', emotion: '😄' },
];

export function ChatDemo() {
    const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
    const [typingText, setTypingText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [currentEmotion, setCurrentEmotion] = useState('😊');

    useEffect(() => {
        if (currentMessageIndex >= demoMessages.length) {
            const resetTimer = setTimeout(() => {
                setVisibleMessages([]);
                setCurrentMessageIndex(0);
                setCurrentEmotion('😊');
            }, 4000);
            return () => clearTimeout(resetTimer);
        }

        const currentMessage = demoMessages[currentMessageIndex];

        if (currentMessage.type === 'avatar') {
            setIsTyping(true);
            if (currentMessage.emotion) {
                setCurrentEmotion(currentMessage.emotion);
            }
            const typingTimer = setTimeout(() => {
                setIsTyping(false);
                typeMessage(currentMessage);
            }, 1000);
            return () => clearTimeout(typingTimer);
        } else {
            const timer = setTimeout(() => {
                setVisibleMessages(prev => [...prev, currentMessage]);
                setCurrentMessageIndex(prev => prev + 1);
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [currentMessageIndex]);

    const typeMessage = (message: Message) => {
        let charIndex = 0;
        setTypingText('');

        const typeInterval = setInterval(() => {
            if (charIndex < message.text.length) {
                setTypingText(message.text.slice(0, charIndex + 1));
                charIndex++;
            } else {
                clearInterval(typeInterval);
                setVisibleMessages(prev => [...prev, message]);
                setTypingText('');
                setCurrentMessageIndex(prev => prev + 1);
            }
        }, 35);
    };

    return (
        <div className="chat-demo">
            {/* Avatar Section */}
            <div className="avatar-section">
                <div className="avatar-character">
                    <div className="avatar-face">{currentEmotion}</div>
                    <div className="avatar-glow"></div>
                </div>
                <span className="avatar-name">지아 (Jiaa)</span>
                <span className="avatar-role">AI 어시스턴트</span>
            </div>

            {/* Chat Section */}
            <div className="chat-section">
                <div className="chat-messages">
                    {visibleMessages.map((msg) => (
                        <div key={msg.id} className={`chat-bubble ${msg.type}`}>
                            {msg.type === 'avatar' && <span className="bubble-avatar">🤖</span>}
                            <span className="bubble-text">{msg.text}</span>
                        </div>
                    ))}
                    {typingText && (
                        <div className="chat-bubble avatar typing-bubble">
                            <span className="bubble-avatar">🤖</span>
                            <span className="bubble-text">
                                {typingText}
                                <span className="typing-cursor">|</span>
                            </span>
                        </div>
                    )}
                    {isTyping && !typingText && (
                        <div className="chat-bubble avatar typing-indicator">
                            <span className="bubble-avatar">🤖</span>
                            <span className="bubble-text">
                                <span></span>
                                <span></span>
                                <span></span>
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
