import React, { useState, useEffect } from 'react';
import { getAvatars, getPersonalities, updateAvatar, updatePersonality, AvatarInfo, PersonalityInfo, UserInfo } from '../../services/api';
import './settings.css';

interface SettingsViewProps {
    currentUser: UserInfo | null;
    onUpdateUser: (user: UserInfo) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ currentUser, onUpdateUser }) => {
    const [avatars, setAvatars] = useState<AvatarInfo[]>([]);
    const [personalities, setPersonalities] = useState<PersonalityInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'avatar' | 'personality'>('avatar');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [avs, pers] = await Promise.all([getAvatars(), getPersonalities()]);
                setAvatars(avs);
                setPersonalities(pers);
            } catch (error) {
                console.error('Failed to fetch settings data:', error);
            }
        };
        fetchData();
    }, []);

    const handleAvatarSelect = async (avatarId: string) => {
        setIsLoading(true);
        try {
            const updatedUser = await updateAvatar(avatarId);
            onUpdateUser(updatedUser);
            // Sync across windows (Dashboard sidebar page <-> Floating Avatar window)
            localStorage.setItem('user_updated', JSON.stringify({
                type: 'avatar',
                timestamp: Date.now(),
                user: updatedUser
            }));
        } catch (error) {
            console.error('Failed to update avatar:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePersonalitySelect = async (personalityId: string) => {
        setIsLoading(true);
        try {
            const updatedUser = await updatePersonality(personalityId);
            onUpdateUser(updatedUser);
            // Sync across windows
            localStorage.setItem('user_updated', JSON.stringify({
                type: 'personality',
                timestamp: Date.now(),
                user: updatedUser
            }));
        } catch (error) {
            console.error('Failed to update personality:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="settings-view">
            <div className="settings-tabs">
                <button
                    className={`tab-btn ${activeTab === 'avatar' ? 'active' : ''}`}
                    onClick={() => setActiveTab('avatar')}
                >
                    아바타
                </button>
                <button
                    className={`tab-btn ${activeTab === 'personality' ? 'active' : ''}`}
                    onClick={() => setActiveTab('personality')}
                >
                    성격
                </button>
            </div>

            <div className="settings-content">
                {activeTab === 'avatar' ? (
                    <div className="avatar-grid">
                        {avatars.map(avatar => (
                            <div
                                key={avatar.id}
                                className={`avatar-item ${currentUser?.avatarId === avatar.id ? 'selected' : ''}`}
                                onClick={() => handleAvatarSelect(avatar.id)}
                            >
                                <div className="avatar-preview">
                                    <div className="avatar-icon">👤</div>
                                </div>
                                <span className="avatar-name">{avatar.name}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="personality-list">
                        {personalities.map(personality => (
                            <div
                                key={personality.id}
                                className={`personality-item ${currentUser?.personalityId === personality.id ? 'selected' : ''}`}
                                onClick={() => handlePersonalitySelect(personality.id)}
                            >
                                <div className="personality-info">
                                    <span className="personality-name">{personality.name}</span>
                                    <p className="personality-desc">{personality.description}</p>
                                </div>
                                {currentUser?.personalityId === personality.id && (
                                    <div className="selected-badge">선택됨</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isLoading && <div className="settings-loading-overlay">변경 중...</div>}
        </div>
    );
};

export default SettingsView;
