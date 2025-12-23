import React, { useEffect, useRef, useState } from 'react';
import { Live2DManager } from '../../managers/Live2DManager';
import { ChatUI } from '../../components/ChatUI';

import './avatar.css';

const Avatar: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const init = async () => {
            if (!canvasRef.current) return;

            try {
                const exists = await window.electronAPI.checkModelExists();
                if (!exists) {
                    setIsDownloading(true);

                    const cleanupProgress = window.electronAPI.onModelDownloadProgress((progress) => {
                        setDownloadProgress(progress);
                    });

                    const result = await window.electronAPI.downloadModel();
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
            window.electronAPI?.showContextMenu();
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
            {/* 채팅 UI - WebSocket URL은 나중에 연결 시 props로 전달 */}
            {/* 예: websocketUrl="ws://localhost:8080/chat" */}
            <ChatUI
                bubbleDuration={5000}
            // websocketUrl="ws://your-server.com/chat"
            />
        </>
    );
};

export default Avatar;

