import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Live2DManager } from '../../managers/Live2DManager';
import { ChatUI, ChatMode } from '../../components/ChatUI';
import { CHAT_WS_URL } from '../../../common/constants';

import { tokenService } from '../../services/tokenService';
import ChatService from '../../services/ChatService';
import { getRoadmaps } from '../../services/chatApiService';
import { getCurrentUser } from '../../services/api';
import SettingsModal from '../../components/SettingsModal/SettingsModal';

import './avatar.css';

interface TodayRoadmap {
    name: string;
    day: number;
    tasks: { content: string; time: string }[];
}

// 오늘 로드맵 데이터를 계산하는 함수
const getTodayRoadmapFromData = (roadmaps: any[]): TodayRoadmap | null => {
    if (!roadmaps || roadmaps.length === 0) return null;

    // 가장 최근 로드맵에서 오늘 일차 찾기
    const latestRoadmap = roadmaps[0];
    const items = latestRoadmap.items || [];
    if (items.length === 0) return null;

    // 시작일 기준 오늘 일차 계산
    const firstItem = items[0];
    const startDate = new Date(firstItem.created_at);
    const today = new Date();
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff >= 0 && daysDiff < items.length) {
        const todayItem = items[daysDiff];
        return {
            name: latestRoadmap.name,
            day: todayItem.day || daysDiff + 1,
            tasks: (todayItem.tasks || []).map((t: any) => ({
                content: t.content,
                time: t.time
            }))
        };
    }
    return null;
};

const Avatar: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [chatMode, setChatMode] = useState<ChatMode>('chat');

    // 현재 사용자 정보를 관리 (아바타/성격 변경 반영을 위해)
    const [user, setUser] = useState<any>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // React Query로 로드맵 데이터 가져오기
    const { data: roadmapsData } = useQuery({
        queryKey: ['roadmaps'],
        queryFn: async () => {
            return await getRoadmaps();
        },
        staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    });

    // 로드맵 데이터에서 오늘 로드맵 계산
    const todayRoadmap = useMemo(() => {
        return getTodayRoadmapFromData(roadmapsData || []);
    }, [roadmapsData]);

    // 로드맵 컨텍스트 문자열 생성
    const roadmapContext = todayRoadmap ?
        `로드맵: ${todayRoadmap.name}\nDay ${todayRoadmap.day} 오늘 할 일:\n${todayRoadmap.tasks.map((t, i) => `${i + 1}. ${t.content} (${t.time})`).join('\n')}`
        : '';

    // 아바타 모델 로드 함수
    const loadAvatarModel = async (userInfo: any) => {
        if (!canvasRef.current) return;

        try {
            const modelName = userInfo.avatarId === 'default' ? 'robot' : userInfo.avatarId;
            const modelUrl = userInfo.avatarUrl;

            const exists = await electronAPI.checkModelExists(modelName);
            if (!exists) {
                setIsDownloading(true);
                const cleanupProgress = electronAPI.onModelDownloadProgress((progress) => {
                    setDownloadProgress(progress);
                });

                const result = await electronAPI.downloadModel(modelName, modelUrl);
                cleanupProgress();

                if (!result.success) {
                    setError(result.error || 'Failed to download model');
                    setIsDownloading(false);
                    return;
                }
                setIsDownloading(false);
            }

            const manager = Live2DManager.getInstance();
            // 기존 모델 해제 후 새 모델 로드
            manager.initialize(canvasRef.current, modelName, modelUrl);
            manager.enableSync();

            setTimeout(() => {
                manager.setModelTransform(4.0, -1.2);
            }, 500);
        } catch (err: any) {
            setError(err.message || 'An error occurred during model loading');
        }
    };

    // 다른 창(대시보드 사이드바 등)에서의 변경 사항 동기화
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'user_updated' && e.newValue) {
                try {
                    const data = JSON.parse(e.newValue);
                    const updatedUser = data.user;

                    if (data.type === 'avatar' && user?.avatarId !== updatedUser.avatarId) {
                        console.log('[Avatar Sync] Reloading model due to external update');
                        loadAvatarModel(updatedUser);
                    }
                    if (data.type === 'personality' && user?.personalityId !== updatedUser.personalityId) {
                        console.log('[Avatar Sync] Reconnecting chat due to external personality update');
                        ChatService.getInstance().reconnect();
                    }

                    setUser(updatedUser);
                } catch (err) {
                    console.error('Failed to parse storage sync data:', err);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [user, loadAvatarModel]);

    useEffect(() => {
        if (!canvasRef.current) return;

        const init = async () => {
            try {
                const isLoggedIn = await tokenService.tryAutoLogin();
                if (isLoggedIn) {
                    const userInfo = await getCurrentUser();
                    setUser(userInfo);
                    await loadAvatarModel(userInfo);
                } else {
                    // Fallback for not logged in
                    const fallbackUser = { avatarId: 'default', avatarName: 'robot', avatarUrl: 'https://project-jiaa-images.s3.ap-northeast-2.amazonaws.com/robot.zip' };
                    setUser(fallbackUser);
                    await loadAvatarModel(fallbackUser);
                }
            } catch (err: any) {
                setError(err.message || 'An error occurred during initialization');
            }
        };

        init();
        // ... (rest of listeners)

        const handleResize = () => {
            const manager = Live2DManager.getInstance();
            manager.resizeCanvas();
        };

        window.addEventListener('resize', handleResize);

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            electronAPI.showContextMenu();
        };

        window.addEventListener('contextmenu', handleContextMenu);

        // Use document-level mouse tracking for click-through windows
        // setIgnoreMouseEvents(true, { forward: true }) forwards mouse events at document level
        const handleMouseMove = (e: MouseEvent) => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const manager = Live2DManager.getInstance();
            manager.onMouseMove(x, y);
        };

        document.addEventListener('mousemove', handleMouseMove);

        // Listen for avatar-show event to refresh token when avatar window becomes visible again
        // This happens after user logs in on main window and closes dashboard
        const cleanupAvatarShow = electronAPI.onAvatarShow(async () => {
            console.log('[Avatar] Window shown, attempting token refresh...');
            const isLoggedIn = await tokenService.tryAutoLogin();
            console.log(`[Avatar] Token refresh on show: ${isLoggedIn ? '성공' : '실패 또는 미로그인'}`);
            if (isLoggedIn) {
                console.log(`[Avatar] Access token now available: ${!!tokenService.getAccessToken()}`);
            }
        });

        return () => {
            const manager = Live2DManager.getInstance();
            manager.disableSync();
            Live2DManager.releaseInstance();
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('mousemove', handleMouseMove);
            cleanupAvatarShow();
        };
    }, []);

    return (
        <>
            {isDownloading && (
                <div className="model-loading-overlay">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <div className="loading-text">
                            Downloading Model... {downloadProgress}%
                        </div>
                    </div>
                </div>
            )}
            {error && (
                <div className="error-overlay">
                    <div className="error-text">Error: {error}</div>
                    <button onClick={() => window.location.reload()}>Retry</button>
                </div>
            )}
            <canvas
                ref={canvasRef}
                id="live2d"
                style={{
                    width: '100vw',
                    height: '100vh',
                    display: isDownloading || error ? 'none' : 'block'
                }}
            />
            {/* 채팅 UI - WebSocket URL 연결 */}
            <ChatUI
                bubbleDuration={5000}
                websocketUrl={CHAT_WS_URL}
                chatMode={chatMode}
                todayRoadmapContext={roadmapContext}
                onModeChange={(mode) => {
                    setChatMode(mode);
                    // 백엔드 세션 모드 업데이트
                    ChatService.getInstance().updateChatMode(mode);
                }}
            />

            {/* 설정 버튼 */}
            <button
                className="settings-btn"
                onClick={() => setIsSettingsOpen(true)}
                title="설정"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
            </button>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                currentUser={user}
                onUpdateUser={(updatedUser) => {
                    if (user?.avatarId !== updatedUser.avatarId) {
                        loadAvatarModel(updatedUser);
                    }
                    if (user?.personalityId !== updatedUser.personalityId) {
                        // 성격 변경 시 세션 초기화가 필요할 수 있음
                        ChatService.getInstance().reconnect();
                    }
                    setUser(updatedUser);
                }}
            />
        </>
    );
};

export default Avatar;

