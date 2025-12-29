import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Live2DManager } from '../../managers/Live2DManager';
import { ChatUI, ChatMode } from '../../components/ChatUI';
import { CHAT_WS_URL } from '../../../common/constants';

import { tokenService } from '../../services/tokenService';
import ChatService from '../../services/ChatService';
import { getRoadmaps } from '../../services/chatApiService';

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


    useEffect(() => {
        if (!canvasRef.current) return;

        const init = async () => {
            if (!canvasRef.current) return;

            try {
                // 아바타 윈도우에서 토큰 자동 로그인 시도
                // 메인 윈도우에서 로그인한 refreshToken으로 accessToken을 발급받음
                const isLoggedIn = await tokenService.tryAutoLogin();
                console.log(`[Avatar] Token auto-login: ${isLoggedIn ? '성공' : '실패 또는 미로그인'}`);
                if (isLoggedIn) {
                    console.log(`[Avatar] Access token available: ${!!tokenService.getAccessToken()}`);
                }
                const exists = await electronAPI.checkModelExists();
                if (!exists) {
                    setIsDownloading(true);

                    const cleanupProgress = electronAPI.onModelDownloadProgress((progress) => {
                        setDownloadProgress(progress);
                    });

                    const result = await electronAPI.downloadModel();
                    cleanupProgress();

                    if (!result.success) {
                        setError(result.error || 'Failed to download model');
                        setIsDownloading(false);
                        return;
                    }
                    setIsDownloading(false);
                }

                const manager = Live2DManager.getInstance();
                manager.initialize(canvasRef.current);

                // Enable sync with other windows (Dashboard)
                manager.enableSync();

                // Wait for model to load, then set upper body view
                // Scale 4.0 = zoom in, offsetY -1.2 = shift down to show upper body
                setTimeout(() => {
                    manager.setModelTransform(4.0, -1.2);
                }, 500);
            } catch (err: any) {
                setError(err.message || 'An error occurred during initialization');
            }
        };

        init();

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

        return () => {
            const manager = Live2DManager.getInstance();
            manager.disableSync();
            Live2DManager.releaseInstance();
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('mousemove', handleMouseMove);
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
        </>
    );
};

export default Avatar;

