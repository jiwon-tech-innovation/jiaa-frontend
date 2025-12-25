import React, { useState } from "react";
import './avatar_select.css';

const Avatar_select: React.FC = () => {
    const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null);

    const handleAvatarSelect = (index: number) => {
        setSelectedAvatar(index);
        // TODO: 아바타 선택 로직 구현
        console.log('Selected avatar:', index);
    };

    const handleConfirm = () => {
        if (selectedAvatar !== null) {
            console.log('Confirm avatar:', selectedAvatar);
            // first-create-loadmap 페이지로 이동
            window.electronAPI.openFirstCreateLoadmap();
        }
    };

    return (
        <div className="avatar-select-container">
            <div className="gradient-overlay">
                <div className="gradient-left"></div>
                <div className="gradient-right"></div>
                <div className="glow-top-left"></div>
                <div className="glow-bottom-right"></div>
            </div>
            
            <div className="content-wrapper">
                <h1 className="title">아바타를 설정해주세요.</h1>
                
                <div className="avatar-options">
                    {[0, 1, 2].map((index) => (
                        <div
                            key={index}
                            className={`avatar-box ${selectedAvatar === index ? 'selected' : ''}`}
                            onClick={() => handleAvatarSelect(index)}
                        >
                            {/* 아바타 이미지나 아이콘이 들어갈 공간 */}
                        </div>
                    ))}
                </div>
                
                {selectedAvatar !== null && (
                    <button className="confirm-button" onClick={handleConfirm}>
                        확인
                    </button>
                )}
            </div>
        </div>
    );
};

export default Avatar_select;