import React, { useState } from 'react';
import './social.css';

const Social: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState<'create' | 'join'>('create');
    const [groupPermission, setGroupPermission] = useState<'strict' | 'open'>('strict');
    const [newGroupName, setNewGroupName] = useState('');
    const [currentView, setCurrentView] = useState<'list' | 'group'>('list');
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [activeChannel, setActiveChannel] = useState<{ id: string, type: 'text' | 'voice' | 'roadmap', name: string }>({ id: 'general', type: 'text', name: '일반' });

    // Mock data for recommended users
    const recommendedUsers = [
        { id: 1, name: '김철수', avatar: '🎮' },
        { id: 2, name: '이영희', avatar: '📚' },
        { id: 3, name: '박민수', avatar: '💻' },
        { id: 4, name: '정수진', avatar: '🎨' },
    ];

    // Mock data for friend groups
    const friendGroups = [
        { id: 1, name: '스터디 그룹', members: 8, avatar: '📖' },
        { id: 2, name: '게임 친구들', members: 12, avatar: '🎮' },
        { id: 3, name: '개발자 모임', members: 15, avatar: '💻' },
        { id: 4, name: '운동 메이트', members: 6, avatar: '🏃' },
    ];

    // Modals & Inputs
    const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
    const [isCreateVoiceModalOpen, setIsCreateVoiceModalOpen] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [newVoiceName, setNewVoiceName] = useState('');

    // State for my groups (with channel data)
    const [myGroups, setMyGroups] = useState([
        {
            id: 1, name: 'React 스터디', members: 10, avatar: '⚛️',
            description: 'React 기초부터 심화까지 함께 공부하는 공부하는 그룹입니다.',
            permission: 'open', isAdmin: false,
            channels: [
                { id: 'general', name: '일반', messages: [{ id: 1, sender: '김철수', text: '안녕하세요! React 스터디 일반 채널입니다.', time: '12:00' }] },
                { id: 'study-logs', name: '공부-인증', messages: [] },
                { id: 'resources', name: '자료-공유', messages: [] },
            ],
            voiceChannels: [
                { id: 'voice-1', name: '대화방 1', members: ['김철수', '이영희'], messages: [] },
                { id: 'focus-room', name: '집중 공부실', members: [], messages: [] },
            ]
        },
        {
            id: 2, name: '알고리즘 연습', members: 8, avatar: '🧮',
            description: '매일 한 문제씩 알고리즘을 푸는 모임입니다.',
            permission: 'strict', isAdmin: false,
            channels: [
                { id: 'general', name: '일반', messages: [{ id: 1, sender: '나', text: '알고리즘 공부 시작해볼까요?', time: '10:00' }] },
                { id: 'q-and-a', name: '코드-질문', messages: [] },
            ],
            voiceChannels: [
                { id: 'algo-voice', name: '문제 풀이방', members: [], messages: [] },
            ]
        },
        {
            id: 3, name: '프로젝트 팀', members: 5, avatar: '🚀',
            description: '혁신적인 웹 서비스를 만드는 팀 프로젝트 공간입니다.',
            permission: 'open', isAdmin: true,
            channels: [
                { id: 'general', name: '일반', messages: [{ id: 1, sender: '팀장', text: '팀 프로젝트 채널입니다.', time: '09:00' }] },
                { id: 'backend', name: '백엔드', messages: [] },
                { id: 'frontend', name: '프론트엔드', messages: [] },
            ],
            voiceChannels: [
                { id: 'team-meeting', name: '회의실', members: [], messages: [] },
            ]
        },
    ]);

    const [chatInput, setChatInput] = useState('');

    const handleCreateChannel = () => {
        if (!newChannelName.trim() || !selectedGroup) return;
        const newChannel = {
            id: `ch-${Date.now()}`,
            name: newChannelName.trim(),
            messages: []
        };
        const updatedGroups = myGroups.map(g => {
            if (g.id === selectedGroup.id) {
                const updatedChannels = [...g.channels, newChannel];
                setSelectedGroup({ ...g, channels: updatedChannels });
                return { ...g, channels: updatedChannels };
            }
            return g;
        });
        setMyGroups(updatedGroups);
        setNewChannelName('');
        setIsCreateChannelModalOpen(false);
    };

    const handleCreateVoiceChannel = () => {
        if (!newVoiceName.trim() || !selectedGroup) return;
        const newVoice = {
            id: `vc-${Date.now()}`,
            name: newVoiceName.trim(),
            members: [],
            messages: []
        };
        const updatedGroups = myGroups.map(g => {
            if (g.id === selectedGroup.id) {
                const updatedVoice = [...g.voiceChannels, newVoice];
                setSelectedGroup({ ...g, voiceChannels: updatedVoice });
                return { ...g, voiceChannels: updatedVoice };
            }
            return g;
        });
        setMyGroups(updatedGroups);
        setNewVoiceName('');
        setIsCreateVoiceModalOpen(false);
    };

    const handleDeleteChannel = (e: React.MouseEvent, channelId: string) => {
        e.stopPropagation();
        if (channelId === 'general') {
            alert('일반 채널은 삭제할 수 없습니다.');
            return;
        }

        if (!confirm('정말로 이 채널을 삭제하시겠습니까?')) return;

        const updatedGroups = myGroups.map(g => {
            if (g.id === selectedGroup.id) {
                const updatedChannels = g.channels.filter((ch: any) => ch.id !== channelId);
                const updatedGroup = { ...g, channels: updatedChannels };
                if (selectedGroup.id === g.id) {
                    setSelectedGroup(updatedGroup);
                }
                return updatedGroup;
            }
            return g;
        });

        setMyGroups(updatedGroups);
        if (activeChannel.id === channelId) {
            setActiveChannel({ id: 'general', type: 'text', name: '일반' });
        }
    };

    const handleDeleteVoiceChannel = (e: React.MouseEvent, voiceId: string) => {
        e.stopPropagation();
        if (!confirm('정말로 이 음성 채널을 삭제하시겠습니까?')) return;

        const updatedGroups = myGroups.map(g => {
            if (g.id === selectedGroup.id) {
                const updatedVoice = g.voiceChannels.filter((vc: any) => vc.id !== voiceId);
                const updatedGroup = { ...g, voiceChannels: updatedVoice };
                if (selectedGroup.id === g.id) {
                    setSelectedGroup(updatedGroup);
                }
                return updatedGroup;
            }
            return g;
        });

        setMyGroups(updatedGroups);
        if (activeChannel.id === voiceId) {
            setActiveChannel({ id: 'general', type: 'text', name: '일반' });
        }
    };

    const handleCreateGroup = () => {
        if (!newGroupName.trim()) return;

        const newGroup = {
            id: Date.now(),
            name: newGroupName,
            members: 1,
            avatar: '📁',
            description: groupPermission === 'strict' ? '강력한 권한이 적용된 새로운 그룹입니다.' : '동등한 권한이 적용된 새로운 그룹입니다.',
            permission: groupPermission,
            isAdmin: true,
            channels: [{ id: 'general', name: '일반', messages: [] }],
            voiceChannels: []
        };

        setMyGroups([...myGroups, newGroup]);
        setNewGroupName('');
        setIsCreateModalOpen(false);
    };

    const handleEnterGroup = (group: any) => {
        setSelectedGroup(group);
        setCurrentView('group');
        setActiveChannel({ id: 'general', type: 'text', name: '일반' });
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !selectedGroup) return;

        const newMessage = {
            id: Date.now(),
            sender: '나',
            text: chatInput,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const updatedGroups = myGroups.map(g => {
            if (g.id === selectedGroup.id) {
                let updatedChannels = [...g.channels];
                let updatedVoiceChannels = [...g.voiceChannels];

                if (activeChannel.type === 'text') {
                    updatedChannels = g.channels.map((ch: any) => {
                        if (ch.id === activeChannel.id) {
                            return { ...ch, messages: [...(ch.messages || []), newMessage] };
                        }
                        return ch;
                    });
                } else if (activeChannel.type === 'voice') {
                    updatedVoiceChannels = g.voiceChannels.map((vc: any) => {
                        if (vc.id === activeChannel.id) {
                            return { ...vc, messages: [...(vc.messages || []), newMessage] };
                        }
                        return vc;
                    });
                }

                const updatedGroup = { ...g, channels: updatedChannels, voiceChannels: updatedVoiceChannels };
                setSelectedGroup(updatedGroup);
                return updatedGroup;
            }
            return g;
        });

        setMyGroups(updatedGroups);
        setChatInput('');
    };

    const handleBackToList = () => {
        setCurrentView('list');
        setSelectedGroup(null);
    };

    return (
        <>
            <div className="social-main-container">
                {currentView === 'list' ? (
                    <>
                        {/* Header Row with Title and Search */}
                        <div className="social-header-row">
                            <h1 className="main-title">소셜</h1>
                            <div className="search-container">
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="검색"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="social-content-wrapper">
                            {/* Recommended Users Section */}
                            <section className="social-section">
                                <div className="section-header">
                                    <h2>추천 사용자</h2>
                                    <button className="scroll-btn">›</button>
                                </div>
                                <div className="horizontal-scroll">
                                    {recommendedUsers.map(user => (
                                        <div key={user.id} className="user-card">
                                            <div className="user-card-avatar">{user.avatar}</div>
                                            <div className="user-card-name">{user.name}</div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Friend Groups Section */}
                            <section className="social-section">
                                <div className="section-header">
                                    <h2>친구 Group</h2>
                                </div>
                                <div className="groups-grid">
                                    {friendGroups.map(group => (
                                        <div key={group.id} className="group-card" onClick={() => handleEnterGroup(group)}>
                                            <div className="group-card-avatar">{group.avatar}</div>
                                            <div className="group-card-info">
                                                <div className="group-card-name">{group.name}</div>
                                                <div className="group-card-members">{group.members}명</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* My Groups Section */}
                            <section className="social-section">
                                <div className="section-header">
                                    <h2>내가 참여 중인 Group</h2>
                                </div>
                                <div className="groups-grid">
                                    {myGroups.map(group => (
                                        <div key={group.id} className="group-card" onClick={() => handleEnterGroup(group)}>
                                            <div className="group-card-avatar">{group.avatar}</div>
                                            <div className="group-card-info">
                                                <div className="group-card-name">{group.name}</div>
                                                <div className="group-card-members">{group.members}명</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Create Group Button */}
                            <button className="create-group-btn" onClick={() => setIsCreateModalOpen(true)}>Group 생성하기</button>
                        </div>
                    </>
                ) : (
                    <div className="group-interior-layout">
                        {/* 1. Left Sidebar: Channels */}
                        <aside className="channel-sidebar">
                            <header className="sidebar-header" onClick={handleBackToList}>
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
                                                onClick={() => setIsCreateChannelModalOpen(true)}
                                            >+</button>
                                        )}
                                    </div>
                                    {selectedGroup?.channels?.map((ch: any) => (
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
                                                    onClick={(e) => handleDeleteChannel(e, ch.id)}
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
                                                onClick={() => setIsCreateVoiceModalOpen(true)}
                                            >+</button>
                                        )}
                                    </div>
                                    {selectedGroup?.voiceChannels?.map((vc: any) => (
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
                                                        onClick={(e) => handleDeleteVoiceChannel(e, vc.id)}
                                                    >×</button>
                                                )}
                                            </div>
                                            {vc.members.length > 0 && (
                                                <div className="voice-participants">
                                                    {vc.members.map((m: string, idx: number) => (
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
                                            {selectedGroup?.channels?.find((c: any) => c.id === activeChannel.id)?.messages?.map((msg: any) => (
                                                <div key={msg.id} className={`message-item ${msg.sender === '나' ? 'own' : ''}`}>
                                                    {msg.sender !== '나' && <div className="message-sender">{msg.sender}</div>}
                                                    <div className="message-bubble">
                                                        <p>{msg.text}</p>
                                                        <span className="message-time">{msg.time}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <form className="chat-input-wrapper" onSubmit={handleSendMessage}>
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
                                                {selectedGroup?.voiceChannels?.find((v: any) => v.id === activeChannel.id)?.members.map((member: string) => (
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
                                                {selectedGroup?.voiceChannels?.find((v: any) => v.id === activeChannel.id)?.messages?.map((msg: any) => (
                                                    <div key={msg.id} className={`message-item ${msg.sender === '나' ? 'own' : ''}`}>
                                                        {msg.sender !== '나' && <div className="message-sender">{msg.sender}</div>}
                                                        <div className="message-bubble">
                                                            <p>{msg.text}</p>
                                                            <span className="message-time">{msg.time}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <form className="chat-input-wrapper" onSubmit={handleSendMessage}>
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
                )}
            </div>

            {/* Create Group Modal */}
            {isCreateModalOpen && (
                <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Group 생성</h2>
                        </div>

                        {/* Tabs */}
                        <div className="modal-tabs">
                            <button
                                className={`modal-tab ${modalTab === 'create' ? 'active' : ''}`}
                                onClick={() => setModalTab('create')}
                            >
                                생성
                            </button>
                            <button
                                className={`modal-tab ${modalTab === 'join' ? 'active' : ''}`}
                                onClick={() => setModalTab('join')}
                            >
                                참여
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="modal-body">
                            {modalTab === 'create' ? (
                                <>
                                    {/* Group Name Section */}
                                    <div className="modal-section">
                                        <h3>그룹 이름</h3>
                                        <input
                                            type="text"
                                            className="code-input"
                                            placeholder="그룹 이름을 입력하세요"
                                            value={newGroupName}
                                            onChange={(e) => setNewGroupName(e.target.value)}
                                        />
                                    </div>

                                    {/* Permission Section */}
                                    <div className="modal-section">
                                        <h3>권한</h3>
                                        <div className="permission-options">
                                            <button
                                                className={`permission-btn ${groupPermission === 'strict' ? 'active' : ''}`}
                                                onClick={() => setGroupPermission('strict')}
                                            >
                                                <div className="radio-icon"></div>
                                                <span>강력한 권한</span>
                                            </button>
                                            <button
                                                className={`permission-btn ${groupPermission === 'open' ? 'active' : ''}`}
                                                onClick={() => setGroupPermission('open')}
                                            >
                                                <div className="radio-icon"></div>
                                                <span>동등한 권한</span>
                                            </button>
                                        </div>
                                        <p className="permission-description">
                                            강력한 권한은 주로 업무, 교육의 목적으로 사용되며 Group 생성자가 구성원의 행동을 확인할 수 있습니다
                                        </p>
                                    </div>

                                    {/* Create Button */}
                                    <button
                                        className="modal-submit-btn"
                                        onClick={handleCreateGroup}
                                        disabled={!newGroupName.trim()}
                                    >
                                        Group 생성하기
                                    </button>
                                </>
                            ) : (
                                <div className="join-content">
                                    <div className="modal-section">
                                        <h3>Group 코드</h3>
                                        <input
                                            type="text"
                                            className="code-input"
                                            placeholder="초대 코드를 입력하세요"
                                        />
                                        <p className="code-description">
                                            친구로부터 받은 Group 초대 코드를 입력하면 해당 그룹에 참여할 수 있습니다.
                                        </p>
                                    </div>
                                    <button className="modal-submit-btn">Group 참여하기</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Channel Modal */}
            {isCreateChannelModalOpen && (
                <div className="modal-overlay" onClick={() => setIsCreateChannelModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>채널 생성</h2>
                        </div>
                        <div className="modal-body">
                            <div className="modal-section">
                                <h3>채널 이름</h3>
                                <input
                                    type="text"
                                    className="code-input"
                                    placeholder="새로운 채널 이름을 입력하세요"
                                    value={newChannelName}
                                    onChange={(e) => setNewChannelName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button
                                    className="modal-submit-btn"
                                    style={{ flex: 1 }}
                                    onClick={handleCreateChannel}
                                    disabled={!newChannelName.trim()}
                                >
                                    채널 만들기
                                </button>
                                <button
                                    className="modal-submit-btn"
                                    style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }}
                                    onClick={() => setIsCreateChannelModalOpen(false)}
                                >
                                    취소
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Voice Channel Modal */}
            {isCreateVoiceModalOpen && (
                <div className="modal-overlay" onClick={() => setIsCreateVoiceModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>음성 채널 생성</h2>
                        </div>
                        <div className="modal-body">
                            <div className="modal-section">
                                <h3>채널 이름</h3>
                                <input
                                    type="text"
                                    className="code-input"
                                    placeholder="새로운 음성 채널 이름을 입력하세요"
                                    value={newVoiceName}
                                    onChange={(e) => setNewVoiceName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button
                                    className="modal-submit-btn"
                                    style={{ flex: 1 }}
                                    onClick={handleCreateVoiceChannel}
                                    disabled={!newVoiceName.trim()}
                                >
                                    채널 만들기
                                </button>
                                <button
                                    className="modal-submit-btn"
                                    style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }}
                                    onClick={() => setIsCreateVoiceModalOpen(false)}
                                >
                                    취소
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Social;
