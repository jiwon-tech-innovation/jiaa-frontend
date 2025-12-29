import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { signout as signoutAction, updateUser } from '../../store/slices/authSlice';
import { signout, getCurrentUser, updateProfile, UserInfo, tokenService, fetchDashboardFullStats, DashboardStatsResponse } from '../../services/api';
import { ContributionGraph } from '../../components/ContributionGraph';
import './profile.css';

const ProfileView: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useAppSelector((state) => state.auth.user);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
    });
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // 토큰이 있는지 확인
    const hasToken = tokenService.isAuthenticated();
    
    // React Query로 사용자 정보 가져오기 (토큰이 있을 때만 실행)
    const { data: userInfo, isLoading, error, isError } = useQuery<UserInfo>({
        queryKey: ['user', 'current'],
        queryFn: async () => {
            console.log('[ProfileView] Fetching user info...');
            try {
                const data = await getCurrentUser();
                console.log('[ProfileView] User info loaded:', data);
                return data;
            } catch (err) {
                console.error('[ProfileView] Error fetching user info:', err);
                throw err;
            }
        },
        enabled: hasToken, // 토큰이 있을 때만 API 호출
        staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
        retry: (failureCount, error: any) => {
            // 403 에러는 재시도하지 않음 (인증 문제)
            if (error?.statusCode === 403 || error?.statusCode === 401) {
                return false;
            }
            return failureCount < 2;
        },
        retryDelay: 1000, // 재시도 간격
    });

    // 활동 통계 데이터 가져오기
    const { data: fullStats } = useQuery<DashboardStatsResponse>({
        queryKey: ['dashboardFullStats', selectedYear],
        queryFn: () => fetchDashboardFullStats(selectedYear),
        enabled: hasToken,
        staleTime: 5 * 60 * 1000,
    });

    // 사용 가능한 년도 목록 생성 (현재 년도부터 2022까지)
    const availableYears = [];
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 2022; year--) {
        availableYears.push(year);
    }

    // userInfo가 로드되면 Redux store와 formData 업데이트
    useEffect(() => {
        if (userInfo) {
            dispatch(updateUser({ 
                email: userInfo.email, 
                name: userInfo.name,
                id: userInfo.id,
                username: userInfo.username,
                avatarId: userInfo.avatarId
            }));
            if (!isEditing) {
                setFormData({ name: userInfo.name || '' });
            }
        }
    }, [userInfo, dispatch, isEditing]);

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
            // React Query 캐시 업데이트
            queryClient.setQueryData(['user', 'current'], updatedInfo);
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

    // 에러가 발생했거나 로딩 중일 때도 Redux store의 user 정보를 사용할 수 있도록 함
    const displayName = userInfo?.name || user?.name || '사용자';
    const displayEmail = userInfo?.email || user?.email || 'user@example.com';

    // formData 초기화 (Redux store의 user 정보 사용)
    useEffect(() => {
        if (!isEditing) {
            if (userInfo?.name) {
                setFormData({ name: userInfo.name });
            } else if (user?.name) {
                setFormData({ name: user.name });
            }
        }
    }, [user, isEditing, userInfo]);

    // 로딩 중이고 사용자 정보가 전혀 없을 때만 로딩 화면 표시
    if (isLoading && hasToken && !user && !userInfo) {
        return (
            <div className="profile-view-container">
                <div className="profile-content">
                    <div style={{ textAlign: 'center', padding: '2rem' }}>로딩 중...</div>
                </div>
            </div>
        );
    }

    // 에러가 발생했고 사용자 정보가 전혀 없을 때만 에러 화면 표시
    if (isError && error && !user && !userInfo) {
        return (
            <div className="profile-view-container">
                <div className="profile-content">
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            사용자 정보를 불러오는데 실패했습니다.
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '1rem' }}>
                            {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}
                        </p>
                        {hasToken && (
                            <button 
                                className="btn-primary" 
                                onClick={() => queryClient.invalidateQueries({ queryKey: ['user', 'current'] })}
                            >
                                다시 시도
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

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

                {/* 활동기록 섹션 */}
                <div className="activity-log-section">
                    <h2 className="activity-log-title">활동기록</h2>
                    <div className="activity-log-content">
                        {/* 왼쪽: 스트릭 카드 */}
                        <div className="streak-card">
                            <div className="streak-text">
                                {fullStats?.currentStreak || 0}일 연속 🔥
                            </div>
                            <div className="streak-progress">
                                {fullStats?.completedDays || 0}/{fullStats?.totalDays || 0}
                            </div>
                            <div className="progress-bars">
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill" 
                                        style={{ 
                                            width: `${fullStats?.totalDays ? ((fullStats.completedDays / fullStats.totalDays) * 100) : 0}%` 
                                        }}
                                    ></div>
                                </div>
                                <div className="progress-bar secondary">
                                    <div 
                                        className="progress-fill" 
                                        style={{ 
                                            width: `${fullStats?.totalDays ? ((fullStats.completedDays / fullStats.totalDays) * 100) : 0}%` 
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* 오른쪽: 활동 그리드 */}
                        <div className="activity-graph-wrapper">
                            <ContributionGraph
                                data={fullStats?.contributionData || []}
                                years={availableYears}
                                selectedYear={selectedYear}
                                onSelectYear={setSelectedYear}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileView;
