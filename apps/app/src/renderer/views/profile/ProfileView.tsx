import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { signout as signoutAction, updateUser } from '../../store/slices/authSlice';
import { signout, getCurrentUser, updateProfile, UserInfo } from '../../services/api';
import './profile.css';

const ProfileView: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const user = useAppSelector((state) => state.auth.user);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [formData, setFormData] = useState({
        name: '',
    });

    useEffect(() => {
        loadUserInfo();
    }, []);

    const loadUserInfo = async () => {
        try {
            setIsLoading(true);
            const info = await getCurrentUser();
            setUserInfo(info);
            setFormData({ name: info.name || '' });
            dispatch(updateUser({ 
                email: info.email, 
                name: info.name,
                id: info.id,
                username: info.username,
                avatarId: info.avatarId
            }));
        } catch (error) {
            console.error('[ProfileView] Failed to load user info:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
        if (userInfo) {
            setFormData({ name: userInfo.name || '' });
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (userInfo) {
            setFormData({ name: userInfo.name || '' });
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            alert('이름을 입력해주세요.');
            return;
        }

        try {
            setIsSaving(true);
            const updatedInfo = await updateProfile({ name: formData.name.trim() });
            setUserInfo(updatedInfo);
            dispatch(updateUser({ 
                email: updatedInfo.email, 
                name: updatedInfo.name,
                id: updatedInfo.id,
                username: updatedInfo.username,
                avatarId: updatedInfo.avatarId
            }));
            setIsEditing(false);
        } catch (error: any) {
            console.error('[ProfileView] Failed to update profile:', error);
            alert(error.message || '프로필 수정에 실패했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

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

    if (isLoading) {
        return (
            <div className="profile-view-container">
                <div className="profile-content">
                    <div style={{ textAlign: 'center', padding: '2rem' }}>로딩 중...</div>
                </div>
            </div>
        );
    }

    const displayName = userInfo?.name || user?.name || '사용자';
    const displayEmail = userInfo?.email || user?.email || 'user@example.com';

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
                            {isEditing ? (
                                <input
                                    type="text"
                                    className="info-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="이름을 입력하세요"
                                />
                            ) : (
                                <div className="info-value">{displayName}</div>
                            )}
                        </div>
                        <div className="info-group">
                            <label>이메일</label>
                            <div className="info-value">{displayEmail}</div>
                        </div>
                    </div>

                    <div className="profile-actions">
                        {isEditing ? (
                            <>
                                <button 
                                    className="btn-primary" 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? '저장 중...' : '저장'}
                                </button>
                                <button 
                                    className="btn-secondary" 
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                >
                                    취소
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="btn-primary" onClick={handleEdit}>프로필 수정</button>
                                <button className="btn-secondary" onClick={handleSignout}>로그아웃</button>
                            </>
                        )}
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
