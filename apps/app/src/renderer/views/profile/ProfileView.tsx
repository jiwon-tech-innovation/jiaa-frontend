import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { signout as signoutAction } from '../../store/slices/authSlice';
import { signout } from '../../services/api';
import './profile.css';

const ProfileView: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const user = useAppSelector((state) => state.auth.user);

    const handleSignout = async () => {
        try {
            await signout();
            dispatch(signoutAction());
            navigate('/signin');
        } catch (error) {
            console.error('[ProfileView] Logout error:', error);
            dispatch(signoutAction());
            navigate('/signin');
        }
    };

    return (
        <div className="profile-view-container">
            <div className="profile-content">
                <header className="profile-header">
                    <h1 className="profile-title">내 프로필</h1>
                </header>

                <div className="profile-card">
                    <div className="profile-avatar-large">
                        <div className="avatar-placeholder"></div>
                        <button className="edit-avatar-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                        </button>
                    </div>

                    <div className="profile-info">
                        <div className="info-group">
                            <label>이름</label>
                            <div className="info-value">사용자</div>
                        </div>
                        <div className="info-group">
                            <label>이메일</label>
                            <div className="info-value">{user?.email || 'user@example.com'}</div>
                        </div>
                        <div className="info-group">
                            <label>소개</label>
                            <div className="info-value muted">자기소개를 입력해주세요.</div>
                        </div>
                    </div>

                    <div className="profile-actions">
                        <button className="btn-primary">프로필 수정</button>
                        <button className="btn-secondary" onClick={handleSignout}>로그아웃</button>
                    </div>
                </div>

                <div className="profile-stats-grid">
                    <div className="stat-card">
                        <span className="stat-label">진행 중인 로드맵</span>
                        <span className="stat-number">3</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">완료한 태스크</span>
                        <span className="stat-number">24</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">활동 일수</span>
                        <span className="stat-number">12일</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileView;
