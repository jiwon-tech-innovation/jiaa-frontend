import React, { useState } from 'react';
import './Avatar_setting.css';

interface AvatarItem {
    id: number;
    name: string;
    thumbnail: string;
}

const AvatarSetting: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');

    // Mock data for recommended avatars
    const recommendedAvatars: AvatarItem[] = [
        { id: 1, name: 'Hiyori', thumbnail: '' },
        { id: 2, name: 'Mao', thumbnail: '' },
        { id: 3, name: 'Rice', thumbnail: '' },
        { id: 4, name: 'Mark', thumbnail: '' },
        { id: 5, name: 'Natori', thumbnail: '' },
    ];

    return (
        <div className="avatar-select-container">
                {/* Header Row with Title and Search */}
                <div className="avatar-header-row">
                    <h1 className="main-title">아바타</h1>
                    <div className="avatar-search-container">
                        <input
                            type="text"
                            className="avatar-search-input"
                            placeholder="검색"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Content Area */}
                <div className="avatar-content-wrapper">
                    {/* Recommended Avatars Section */}
                    <section className="avatar-section">
                        <div className="avatar-section-header">
                            <h2>추천 아바타</h2>
                            <button className="avatar-scroll-btn">›</button>
                        </div>
                        <div className="avatar-horizontal-scroll">
                            {recommendedAvatars.map((avatar) => (
                                <div key={avatar.id} className="avatar-card">
                                    <div className="avatar-card-thumbnail"></div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Avatar Settings Section */}
                    <section className="avatar-section">
                        <div className="avatar-section-header">
                            <h2>아바타 설정</h2>
                        </div>
                        <div className="avatar-settings-box">
                            {/* Placeholder for future settings */}
                        </div>
                    </section>
                </div>
            </div>
    );
};

export default AvatarSetting;
