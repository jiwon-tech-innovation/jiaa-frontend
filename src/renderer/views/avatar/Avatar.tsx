import React, { useEffect, useRef } from 'react';
import { Application, Ticker } from 'pixi.js';
import { Live2DSprite } from 'easy-live2d';

import './avatar.css';

const Avatar: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const init = async () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            // 1. PixiJS Application init
            const app = new Application();
            await app.init({
                canvas: canvas,
                backgroundAlpha: 0,
                resizeTo: window,
            });

            // 2. Live2D Sprite
            const live2dSprite = new Live2DSprite();

            // 3. Model Init
            try {
                await live2dSprite.init({
                    modelPath: '/live2d/Hiyori/Hiyori.model3.json',
                    ticker: Ticker.shared,
                });

                // 4. Scale & Position
                const scale = Math.max(app.screen.width / live2dSprite.width, app.screen.height / live2dSprite.height) * 5;
                live2dSprite.scale.set(scale);

                live2dSprite.x = (app.screen.width - live2dSprite.width) / 4;
                live2dSprite.y = (app.screen.height - live2dSprite.height) * 0.75;

                // 5. Add to stage
                app.stage.addChild(live2dSprite);

                // Events
                live2dSprite.eventMode = 'static';
                // Click event removed as per user request
                // live2dSprite.on('pointertap', () => {
                //     window.electronAPI?.openSignin();
                // });

                const handleContextMenu = (e: MouseEvent) => {
                    e.preventDefault();
                    window.electronAPI?.showContextMenu();
                };

                window.addEventListener('contextmenu', handleContextMenu);

                return () => {
                    // Cleanup if needed
                    app.destroy(true, { children: true, texture: true });
                    window.removeEventListener('contextmenu', handleContextMenu);
                };

            } catch (error) {
                console.error('Live2D Model Load Failed:', error);
            }
        };

        init();
    }, []);

    return (
        <canvas
            ref={canvasRef}
            id="live2d"
            style={{ width: '100vw', height: '100vh', display: 'block' }}
        />
    );
};

export default Avatar;
