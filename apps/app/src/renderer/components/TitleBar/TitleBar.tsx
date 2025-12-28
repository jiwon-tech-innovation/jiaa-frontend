import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TitleBar.css';

export const TitleBar: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="title-bar">
            <div className="title-bar-drag-area"></div>
            <div className="nav-controls">
                <button onClick={() => navigate(-1)} className="nav-btn" title="뒤로가기">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
                <button onClick={() => navigate(1)} className="nav-btn" title="앞으로가기">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </button>
            </div>
        </div>
    );
};
