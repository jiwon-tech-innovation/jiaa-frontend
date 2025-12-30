import React from 'react';
import SettingsView from './SettingsView';
import { UserInfo } from '../../services/api';
import './settings.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: UserInfo | null;
    onUpdateUser: (user: UserInfo) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentUser, onUpdateUser }) => {
    if (!isOpen) return null;

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-modal" onClick={e => e.stopPropagation()}>
                <div className="settings-header">
                    <h2>설정</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <SettingsView
                    currentUser={currentUser}
                    onUpdateUser={onUpdateUser}
                />
            </div>
        </div>
    );
};

export default SettingsModal;
