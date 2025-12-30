import { Tray, Menu, nativeImage, app } from 'electron';
import path from 'node:path';
import { getAvatarWindow, getMainWindow, showAvatarWindowWithAuth } from '../windows/manager';
import { createMainWindow } from '../windows/mainWindow';

let tray: Tray | null = null;

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

export const createTray = (): void => {
    // Tray Icon 생성
    let iconPath: string;
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        // Development
        iconPath = path.join(app.getAppPath(), 'public/tray-icon.png');
    } else {
        // Production
        iconPath = path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/tray-icon.png`);
    }

    const icon = nativeImage.createFromPath(iconPath);
    // macOS: Template images automatically adapt to light/dark tray themes
    if (process.platform === 'darwin') {
        icon.setTemplateImage(true);
    }
    tray = new Tray(icon.resize({ width: 16, height: 16 }));

    const contextMenu = Menu.buildFromTemplate([
        {
            label: '아바타 모드로 전환',
            click: () => {
                const mainWindow = getMainWindow();
                const avatarWindow = getAvatarWindow();

                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.hide();
                }

                if (avatarWindow && !avatarWindow.isDestroyed()) {
                    showAvatarWindowWithAuth();
                    avatarWindow.focus();
                } else {
                    // Try to recreate if missing
                    const { createAvatarWindow } = require('../windows/avatarWindow');
                    const newWindow = createAvatarWindow();
                    newWindow.show();
                    newWindow.webContents.send('avatar-show');
                }
            }
        },
        {
            label: '메인 윈도우 열기',
            click: () => {
                const avatarWindow = getAvatarWindow();
                const mainWindow = getMainWindow();

                if (avatarWindow && !avatarWindow.isDestroyed()) {
                    avatarWindow.hide();
                }

                if (mainWindow && !mainWindow.isDestroyed()) {
                    if (mainWindow.isMinimized()) mainWindow.restore();
                    mainWindow.show();
                    mainWindow.focus();
                } else {
                    createMainWindow();
                }
            }
        },
        { type: 'separator' },
        {
            label: '종료',
            click: () => {
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Live2D Mascot');

    // 좌클릭: 윈도우 모드 토글
    tray.on('click', () => {
        const mainWindow = getMainWindow();
        const avatarWindow = getAvatarWindow();

        const isMainVisible = mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible() && !mainWindow.isMinimized();

        if (isMainVisible) {
            // Main -> Avatar
            mainWindow.hide();
            if (avatarWindow && !avatarWindow.isDestroyed()) {
                showAvatarWindowWithAuth();
                avatarWindow.focus();
            } else {
                const { createAvatarWindow } = require('../windows/avatarWindow');
                const newWindow = createAvatarWindow();
                newWindow.show();
                newWindow.webContents.send('avatar-show');
            }
        } else {
            // Avatar -> Main (or recreate Main)
            if (avatarWindow && !avatarWindow.isDestroyed()) {
                avatarWindow.hide();
            }

            if (mainWindow && !mainWindow.isDestroyed()) {
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.show();
                mainWindow.focus();
            } else {
                createMainWindow();
            }
        }
    });

    // 우클릭: 컨텍스트 메뉴 열기
    tray.on('right-click', () => {
        if (tray) {
            tray.popUpContextMenu(contextMenu);
        }
    });
};
