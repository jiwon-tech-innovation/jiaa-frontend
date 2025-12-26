import { BrowserWindow, screen } from 'electron';
import path from 'node:path';
import { getAvatarWindow, setAvatarWindow } from './manager';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

export const createAvatarWindow = (): BrowserWindow => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const windowWidth = 450;
    const windowHeight = 350;

    // Create the browser window.
    const avatarWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        x: width - windowWidth,
        y: height - windowHeight,
        frame: false,
        transparent: true,
        hasShadow: false,
        alwaysOnTop: true,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    // Enable click-through while still receiving mouse events
    // forward: true allows the renderer to still track mouse position
    avatarWindow.setIgnoreMouseEvents(true, { forward: true });

    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        avatarWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/views/avatar/index.html`);
    } else {
        avatarWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/views/avatar/index.html`));
    }

    avatarWindow.webContents.openDevTools({ mode: 'detach' });

    setAvatarWindow(avatarWindow);
    return avatarWindow;
};
