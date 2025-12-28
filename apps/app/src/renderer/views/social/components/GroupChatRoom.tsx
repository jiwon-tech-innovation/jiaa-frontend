import React from 'react';

interface Channel {
    id: string;
    name: string;
    messages: Array<{ id: number; sender: string; text: string; time: string }>;
}

interface VoiceChannel {
    id: string;
    name: string;
    members: string[];
    messages: Array<{ id: number; sender: string; text: string; time: string }>;
}

interface Group {
    id: number;
    name: string;
    members: number;
    avatar: string;
    description: string;
    permission: 'strict' | 'open';
    isAdmin: boolean;
    channels: Channel[];
    voiceChannels: VoiceChannel[];
}

interface ActiveChannel {
    id: string;
    type: 'text' | 'voice' | 'roadmap';
    name: string;
}

interface GroupChatRoomProps {
    selectedGroup: Group | null;
    activeChannel: ActiveChannel;
    setActiveChannel: (channel: ActiveChannel) => void;
    chatInput: string;
    setChatInput: (value: string) => void;
    onBackToList: () => void;
    onSendMessage: (e: React.FormEvent) => void;
    onDeleteChannel: (e: React.MouseEvent, channelId: string) => void;
    onDeleteVoiceChannel: (e: React.MouseEvent, voiceId: string) => void;
    onOpenCreateChannelModal: () => void;
    onOpenCreateVoiceModal: () => void;
}

const GroupChatRoom: React.FC<GroupChatRoomProps> = ({
    selectedGroup,
    activeChannel,
    setActiveChannel,
    chatInput,
    setChatInput,
    onBackToList,
    onSendMessage,
    onDeleteChannel,
    onDeleteVoiceChannel,
    onOpenCreateChannelModal,
    onOpenCreateVoiceModal,
}) => {
    return (
        <div className="group-interior-layout">
            {/* 1. Left Sidebar: Channels */}
            <aside className="channel-sidebar">
                <header className="sidebar-header" onClick={onBackToList}>
                    <button className="back-to-list-btn">‹</button>
                    <h3>{selectedGroup?.name}</h3>
                </header>

                <div className="sidebar-scrollable">
                    {/* Group Roadmap Shortcut */}
                    <div className="channel-category">
                        <div className="category-label">그룹 정보</div>
                        <div
                            className={`channel-item ${activeChannel.type === 'roadmap' ? 'active' : ''}`}
                            onClick={() => setActiveChannel({ id: 'roadmap', type: 'roadmap', name: '로드맵' })}
                        >
                            <span className="channel-icon">🗺️</span>
                            <span className="channel-name">로드맵</span>
                        </div>
                    </div>

                    {/* Text Channels */}
                    <div className="channel-category">
                        <div className="category-label">
                            <span>채팅 채널</span>
                            {(selectedGroup?.permission === 'open' || (selectedGroup?.permission === 'strict' && selectedGroup?.isAdmin)) && (
                                <button
                                    className="create-channel-btn"
                                    title="채널 만들기"
                                    onClick={onOpenCreateChannelModal}
                                >+</button>
                            )}
                        </div>
                        {selectedGroup?.channels?.map((ch) => (
                            <div
                                key={ch.id}
                                className={`channel-item ${activeChannel.id === ch.id ? 'active' : ''}`}
                                onClick={() => setActiveChannel({ id: ch.id, type: 'text', name: ch.name })}
                            >
                                <div className="channel-item-left">
                                    <span className="channel-icon">#</span>
                                    <span className="channel-name">{ch.name}</span>
                                </div>
                                {(selectedGroup?.permission === 'open' || (selectedGroup?.permission === 'strict' && selectedGroup?.isAdmin)) && ch.id !== 'general' && (
                                    <button
                                        className="delete-channel-btn"
                                        title="채널 삭제"
                                        onClick={(e) => onDeleteChannel(e, ch.id)}
                                    >×</button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Voice Channels */}
                    <div className="channel-category">
                        <div className="category-label">
                            <span>음성 채널</span>
                            {(selectedGroup?.permission === 'open' || (selectedGroup?.permission === 'strict' && selectedGroup?.isAdmin)) && (
                                <button
                                    className="create-channel-btn"
                                    title="음성 채널 만들기"
                                    onClick={onOpenCreateVoiceModal}
                                >+</button>
                            )}
                        </div>
                        {selectedGroup?.voiceChannels?.map((vc) => (
                            <div key={vc.id} className="voice-channel-group">
                                <div
                                    className={`channel-item ${activeChannel.id === vc.id ? 'active' : ''}`}
                                    onClick={() => setActiveChannel({ id: vc.id, type: 'voice', name: vc.name })}
                                >
                                    <div className="channel-item-left">
                                        <span className="channel-icon">🔊</span>
                                        <span className="channel-name">{vc.name}</span>
                                    </div>
                                    {(selectedGroup?.permission === 'open' || (selectedGroup?.permission === 'strict' && selectedGroup?.isAdmin)) && (
                                        <button
                                            className="delete-channel-btn"
                                            title="채널 삭제"
                                            onClick={(e) => onDeleteVoiceChannel(e, vc.id)}
                                        >×</button>
                                    )}
                                </div>
                                {vc.members.length > 0 && (
                                    <div className="voice-participants">
                                        {vc.members.map((m, idx) => (
                                            <div key={idx} className="participant-item">
                                                <div className="participant-dot"></div>
                                                <span>{m}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* User Control Panel at Bottom */}
                <footer className="sidebar-footer">
                    <div className="user-mini-profile">
                        <div className="mini-avatar">👤</div>
                        <div className="mini-info">
                            <span className="mini-name">나 (User)</span>
                            <span className="mini-status">온라인</span>
                        </div>
                    </div>
                    <div className="footer-actions">
                        <button title="마이크">🎙️</button>
                        <button title="설정">⚙️</button>
                    </div>
                </footer>
            </aside>

            {/* 2. Main Content Area */}
            <main className="group-main-content">
                {/* Header showing active channel name */}
                <header className="content-header">
                    <div className="header-left">
                        <span className="header-icon">
                            {activeChannel.type === 'text' ? '#' : activeChannel.type === 'voice' ? '🔊' : '🗺️'}
                        </span>
                        <h2>{activeChannel.name}</h2>
                    </div>
                </header>

                {/* Body depending on channel type */}
                <div className="content-body">
                    {activeChannel.type === 'text' && (
                        <div className="chat-view-container">
                            <div className="chat-messages-container">
                                {selectedGroup?.channels?.find((c) => c.id === activeChannel.id)?.messages?.map((msg) => (
                                    <div key={msg.id} className={`message-item ${msg.sender === '나' ? 'own' : ''}`}>
                                        {msg.sender !== '나' && <div className="message-sender">{msg.sender}</div>}
                                        <div className="message-bubble">
                                            <p>{msg.text}</p>
                                            <span className="message-time">{msg.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <form className="chat-input-wrapper" onSubmit={onSendMessage}>
                                <input
                                    type="text"
                                    placeholder={`#${activeChannel.name}에 메시지 보내기`}
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                />
                            </form>
                        </div>
                    )}

                    {activeChannel.type === 'roadmap' && (
                        <div className="roadmap-view-container">
                            <div className="group-roadmap-list">
                                <div className="group-roadmap-item">
                                    <div className="roadmap-status-dot completed"></div>
                                    <div className="roadmap-item-info">
                                        <p className="item-title">React 기초 문법 정복</p>
                                        <p className="item-date">2025.12.28 완료</p>
                                    </div>
                                </div>
                                <div className="group-roadmap-item">
                                    <div className="roadmap-status-dot active"></div>
                                    <div className="roadmap-item-info">
                                        <p className="item-title">컴포넌트 스타일링 실습</p>
                                        <p className="item-date">진행 중</p>
                                    </div>
                                </div>
                                <div className="group-roadmap-item">
                                    <div className="roadmap-status-dot"></div>
                                    <div className="roadmap-item-info">
                                        <p className="item-title">상태 관리 심화 (Redux)</p>
                                        <p className="item-date">대기</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeChannel.type === 'voice' && (
                        <div className="voice-room-container">
                            <div className="voice-main-area">
                                <div className="voice-participants-grid">
                                    {selectedGroup?.voiceChannels?.find((v) => v.id === activeChannel.id)?.members.map((member) => (
                                        <div key={member} className="voice-user-card">
                                            <div className="voice-avatar-large">👤</div>
                                            <span>{member}</span>
                                        </div>
                                    ))}
                                    <div className="voice-user-card own">
                                        <div className="voice-avatar-large">👤</div>
                                        <span>나 (User)</span>
                                    </div>
                                </div>
                                <div className="voice-controls">
                                    <button className="v-btn mute">🎙️</button>
                                    <button className="v-btn deafen">🎧</button>
                                    <button className="v-btn hangup">📞</button>
                                </div>
                            </div>
                            <div className="voice-side-chat">
                                <div className="side-chat-header">채널 채팅</div>
                                <div className="chat-messages-container">
                                    {selectedGroup?.voiceChannels?.find((v) => v.id === activeChannel.id)?.messages?.map((msg) => (
                                        <div key={msg.id} className={`message-item ${msg.sender === '나' ? 'own' : ''}`}>
                                            {msg.sender !== '나' && <div className="message-sender">{msg.sender}</div>}
                                            <div className="message-bubble">
                                                <p>{msg.text}</p>
                                                <span className="message-time">{msg.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <form className="chat-input-wrapper" onSubmit={onSendMessage}>
                                    <input
                                        type="text"
                                        placeholder="메시지 보내기"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                    />
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* 3. Right Sidebar: Member List */}
            <aside className="member-sidebar">
                <div className="member-sidebar-scrollable">
                    <div className="member-category">
                        <div className="category-label">온라인 — 3</div>
                        <div className="member-item online">
                            <div className="member-avatar">👤</div>
                            <div className="member-info">
                                <span className="member-name">나 (User)</span>
                                <span className="member-status-text">공부 중</span>
                            </div>
                        </div>
                        <div className="member-item online">
                            <div className="member-avatar">🎮</div>
                            <div className="member-info">
                                <span className="member-name">김철수</span>
                                <span className="member-status-text">React 열공 중!</span>
                            </div>
                        </div>
                        <div className="member-item online">
                            <div className="member-avatar">📚</div>
                            <div className="member-info">
                                <span className="member-name">이영희</span>
                                <span className="member-status-text">점심 시간...</span>
                            </div>
                        </div>
                    </div>

                    <div className="member-category">
                        <div className="category-label">오프라인 — 2</div>
                        <div className="member-item offline">
                            <div className="member-avatar">💻</div>
                            <div className="member-info">
                                <span className="member-name">박민수</span>
                            </div>
                        </div>
                        <div className="member-item offline">
                            <div className="member-avatar">🎨</div>
                            <div className="member-info">
                                <span className="member-name">정수진</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
};

export default GroupChatRoom;
