import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import SettingsView from '../../components/SettingsModal/SettingsView';
import { getCurrentUser, UserInfo } from '../../services/api';
import './Avatar_setting.css';

const AvatarSetting: React.FC = () => {
    const [user, setUser] = useState<UserInfo | null>(null);
    const { isTokenReady } = useOutletContext<{ isTokenReady: boolean }>();

    useEffect(() => {
        if (!isTokenReady) return;

        const fetchUser = async () => {
            try {
                const userInfo = await getCurrentUser();
                setUser(userInfo);
            } catch (error) {
                console.error('Failed to fetch user:', error);
            }
        };
        fetchUser();
    }, [isTokenReady]);

    return (
        <div className="avatar-select-container">
            <div className="avatar-header-row">
                <h1 className="main-title">아바타 및 성격 설정</h1>
            </div>

            <div className="avatar-content-wrapper">
                {isTokenReady && (
                    <SettingsView
                        currentUser={user}
                        onUpdateUser={(updatedUser) => setUser(updatedUser)}
                    />
                )}
            </div>
        </div>
    );
};

export default AvatarSetting;
