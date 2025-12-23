import { ipcMain, BrowserWindow, Menu, app, IpcMainEvent } from 'electron';
import { getMainWindow, getAvatarWindow } from '../windows/manager';
import { createMainWindow, loadSigninPage, loadSignupPage, loadDashboardPage } from '../windows/mainWindow';

export const registerIpcHandlers = (): void => {
    // IPC Event for Click-through
    ipcMain.on('set-ignore-mouse-events', (event: IpcMainEvent, ignore: boolean, options: any) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win && !win.isDestroyed()) {
            win.setIgnoreMouseEvents(ignore, options);
        }
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
};
