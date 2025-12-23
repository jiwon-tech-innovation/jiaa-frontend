import { Tray, Menu, nativeImage, app } from 'electron';
import path from 'node:path';
import { getAvatarWindow, getMainWindow } from '../windows/manager';
import { createMainWindow } from '../windows/mainWindow';

let tray: Tray | null = null;

export const createTray = (): void => {
    // Tray Icon 생성
    const iconPath = path.join(__dirname, '../../public/tray-icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon.resize({ width: 16, height: 16 }));

    const contextMenu = Menu.buildFromTemplate([
        {
            label: '아바타 모드로 전환',
            click: () => {
                // Hide main window
                const mainWindow = getMainWindow();
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.hide();
                }
                // Show avatar window
                const avatarWindow = getAvatarWindow();
                if (avatarWindow && !avatarWindow.isDestroyed()) {
                    avatarWindow.show();
                }
            }
        },
        {
            label: '메인 윈도우 열기',
            click: () => {
                // Hide avatar window
                const avatarWindow = getAvatarWindow();
                if (avatarWindow && !avatarWindow.isDestroyed()) {
                    avatarWindow.hide();
                }
                // Show main window
                const mainWindow = getMainWindow();
                if (mainWindow && !mainWindow.isDestroyed()) {
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

    // 좌클릭: 메인 윈도우 토글 (아바타 윈도우와 상호 배타적)
    tray.on('click', () => {
        const mainWindow = getMainWindow();
        const avatarWindow = getAvatarWindow();

        if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
            // Main window visible -> hide it, show avatar
            mainWindow.hide();
            if (avatarWindow && !avatarWindow.isDestroyed()) {
                avatarWindow.show();
            }
        } else {
            // Main window not visible -> show it, hide avatar
            if (avatarWindow && !avatarWindow.isDestroyed()) {
                avatarWindow.hide();
            }
            if (mainWindow && !mainWindow.isDestroyed()) {
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
