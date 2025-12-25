import { ipcMain, BrowserWindow, Menu, app, IpcMainEvent } from 'electron';
import { getMainWindow, getAvatarWindow } from '../windows/manager';
import { createMainWindow, loadSigninPage, loadSignupPage, loadDashboardPage, loadSettingPage, loadProfilePage } from '../windows/mainWindow';
import { checkModelExists, downloadAndExtractModel, getModelDirectory } from '../services/modelManager';
import { MODEL_NAME } from '../../common/constants';

export const registerIpcHandlers = (): void => {
    // IPC Event for Click-through
    ipcMain.on('set-ignore-mouse-events', (event: IpcMainEvent, ignore: boolean, options: any) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win && !win.isDestroyed()) {
            win.setIgnoreMouseEvents(ignore, options);
        }
    });

    ipcMain.on('renderer-log', (event, message: string) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        const title = win?.getTitle() || 'Renderer';
        console.log(`[${title}] ${message}`);
    });

    // IPC Event for Context Menu
    ipcMain.on('show-context-menu', (event: IpcMainEvent) => {
        const template = [
            {
                label: 'Hide Character',
                click: () => {
                    const win = BrowserWindow.fromWebContents(event.sender);
                    if (win && !win.isDestroyed()) win.hide();
                }
            },
            { type: 'separator' } as Electron.MenuItemConstructorOptions,
            {
                label: 'Quit',
                click: () => { app.quit(); }
            }
        ];
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win && !win.isDestroyed()) {
            const menu = Menu.buildFromTemplate(template);
            menu.popup({ window: win });
        }
    });

    // IPC Event for Signin Window (Now MainWindow)
    ipcMain.on('open-signin', () => {
        console.log('[Main] open-signin event received');
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
            loadSigninPage();
            mainWindow.show();
        } else {
            createMainWindow();
        }
    });

    // IPC Event for Signup Window
    ipcMain.on('open-signup', () => {
        console.log('[Main] open-signup event received');
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
            loadSignupPage();
            mainWindow.show();
        } else {
            createMainWindow();
            // Overwrite the initial load with signup page
            loadSignupPage();
        }
    });

    // IPC Event for Signin Success
    ipcMain.on('signin-success', (event: IpcMainEvent, email: string) => {
        console.log(`[Main] User Signed In: ${email}`);

        // Navigate mainWindow to Dashboard
        loadDashboardPage();

        // Hide Avatar Window while Dashboard is open
        const avatarWindow = getAvatarWindow();
        if (avatarWindow && !avatarWindow.isDestroyed()) {
            avatarWindow.hide();
        }
    });

    // IPC Event for Opening Dashboard
    ipcMain.on('open-dashboard', () => {
        console.log('[Main] open-dashboard event received');
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
            loadDashboardPage();
            mainWindow.show();
        } else {
            createMainWindow();
            loadDashboardPage();
        }
    });

    // IPC Event for Closing Dashboard (closes mainWindow)
    ipcMain.on('close-dashboard', () => {
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.close();
        }
        // Show Avatar Window when Dashboard closes
        const avatarWindow = getAvatarWindow();
        if (avatarWindow && !avatarWindow.isDestroyed()) {
            avatarWindow.show();
        }
    });

    // IPC Event for Opening Setting Page
    ipcMain.on('open-setting', () => {
        console.log('[Main] open-setting event received');
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
            loadSettingPage();
            mainWindow.show();
        } else {
            createMainWindow();
            loadSettingPage();
        }
    });

    // IPC Event for Opening Profile Page
    ipcMain.on('open-profile', () => {
        console.log('[Main] open-profile event received');
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
            loadProfilePage();
            mainWindow.show();
        } else {
            createMainWindow();
            loadProfilePage();
        }
    });

    ipcMain.on('close-setting', () => {
        const mainWindow = getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.close();
        }
        // Show Avatar Window when Dashboard closes
        const avatarWindow = getAvatarWindow();
        if (avatarWindow && !avatarWindow.isDestroyed()) {
            avatarWindow.show();
        }
    });


    // IPC Event for Avatar Movement Sync
    // Broadcasts mouse position from one window to all other windows
    ipcMain.on('sync-avatar-movement', (event: IpcMainEvent, mouseX: number, mouseY: number) => {
        const senderWindow = BrowserWindow.fromWebContents(event.sender);
        const mainWindow = getMainWindow();
        const avatarWindow = getAvatarWindow();

        // Send to main window if sender is avatar window
        if (senderWindow === avatarWindow && mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('avatar-movement-update', mouseX, mouseY);
        }
        // Send to avatar window if sender is main window
        else if (senderWindow === mainWindow && avatarWindow && !avatarWindow.isDestroyed()) {
            avatarWindow.webContents.send('avatar-movement-update', mouseX, mouseY);
        }
    });

    ipcMain.handle('check-model-exists', async () => {
        return checkModelExists();
    });

    ipcMain.handle('download-model', async (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        return await downloadAndExtractModel((progress) => {
            if (win && !win.isDestroyed()) {
                win.webContents.send('model-download-progress', progress);
            }
        });
    });

    ipcMain.handle('get-model-base-path', async () => {
        // Return local-model protocol URL for the model directory
        // Use a dummy host 'local-file' to avoid Punycode issues with non-ASCII model names
        return `local-model://local-file/${MODEL_NAME}/`;
    });

    handleTokenStorage();
};

import { safeStorage } from 'electron';
import fs from 'fs/promises';
import path from 'path';

const handleTokenStorage = () => {
    const getTokenPath = () => path.join(app.getPath('userData'), 'secure_token.enc');

    ipcMain.handle('save-refresh-token', async (_, token: string) => {
        try {
            if (safeStorage.isEncryptionAvailable()) {
                const encryptedBuffer = safeStorage.encryptString(token);
                await fs.writeFile(getTokenPath(), encryptedBuffer);
                return { success: true };
            } else {
                console.warn('[Main] safeStorage not available. Token NOT saved.');
                return { success: false, error: 'Encryption not available' };
            }
        } catch (error: any) {
            console.error('[Main] Failed to save token:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('get-refresh-token', async () => {
        try {
            const tokenPath = getTokenPath();
            // Check if file exists
            try {
                await fs.access(tokenPath);
            } catch {
                return null; // File doesn't exist
            }

            const encryptedBuffer = await fs.readFile(tokenPath);
            if (safeStorage.isEncryptionAvailable()) {
                const decryptedString = safeStorage.decryptString(encryptedBuffer);
                return decryptedString;
            } else {
                return null;
            }
        } catch (error) {
            console.error('[Main] Failed to get token:', error);
            return null;
        }
    });

    ipcMain.handle('delete-refresh-token', async () => {
        try {
            const tokenPath = getTokenPath();
            await fs.unlink(tokenPath);
            return { success: true };
        } catch (error) {
            // Ignore error if file doesn't exist
            return { success: false };
        }
    });
};
