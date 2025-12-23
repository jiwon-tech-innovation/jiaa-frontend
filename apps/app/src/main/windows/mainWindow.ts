import { BrowserWindow } from 'electron';
import path from 'node:path';
import { getMainWindow, setMainWindow } from './manager';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

export const createMainWindow = (): void => {
    let mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
        return;
    }

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/views/signin/signin.html`);
    } else {
        mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/views/signin/signin.html`));
    }

    mainWindow.webContents.openDevTools({ mode: 'detach' });

    mainWindow.on('closed', () => {
        setMainWindow(null);
    });

    setMainWindow(mainWindow);
};

export const toggleMainWindow = (): void => {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isVisible()) {
            mainWindow.close();
        } else {
            mainWindow.show();
        }
    } else {
        createMainWindow();
    }
};

export const loadSigninPage = (): void => {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
        if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
            mainWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/views/signin/signin.html`);
        } else {
            mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/views/signin/signin.html`));
        }
    }
};

export const loadSignupPage = (): void => {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
        if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
            mainWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/views/signup/signup.html`);
        } else {
            mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/views/signup/signup.html`));
        }
    }
};

export const loadDashboardPage = (): void => {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
        if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
            mainWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/views/dashboard/dashboard.html`);
        } else {
            mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/views/dashboard/dashboard.html`));
        }
    }
};
