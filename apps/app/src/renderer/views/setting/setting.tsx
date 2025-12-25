import React, { useState } from 'react';
import { MainLayout } from '../../components/MainLayout/MainLayout';
import './setting.css';

const Setting: React.FC = () => {
    const [screenMode, setScreenMode] = useState<'light' | 'dark' | 'system'>('dark');

    return (
        <MainLayout activeTab="setting">
            <div className="setting-container">
                <header className="header">
                    <h1>설정</h1>
                </header>
                <div className="setting-content">
                    <h2 className="setting-subtitle">화면 설정</h2>

                    {/* 화면 모드 섹션 */}
                    <div className="setting-section">
                        <label className="setting-label">화면모드</label>
                        <div className="mode-buttons">
                            <button
                                className={`mode-button ${screenMode === 'light' ? 'active' : ''}`}
                                onClick={() => setScreenMode('light')}
                            >
                                화이트 모드
                            </button>
                            <button
                                className={`mode-button ${screenMode === 'dark' ? 'active' : ''}`}
                                onClick={() => setScreenMode('dark')}
                            >
                                다크 모드
                            </button>
                            <button
                                className={`mode-button ${screenMode === 'system' ? 'active' : ''}`}
                                onClick={() => setScreenMode('system')}
                            >
                                시스템 설정
                            </button>
                        </div>
                    </div>

                    {/* 아바타 섹션 */}
                    <div className="setting-section">
                        <label className="setting-label">아바타</label>
                        <p className="setting-description">아바타에 대한 세부설명</p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default Setting;
