import { BrowserWindow } from 'electron';
import path from 'node:path';
import { getMainWindow, setMainWindow, getAvatarWindow } from './manager';

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

    const startPage = process.env.START_PAGE || 'dashboard';
    const targetPath = `/views/${startPage}/${startPage === 'avatar' || startPage === 'avatar_select' ? 'index' : startPage}.html`;

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        const url = `${MAIN_WINDOW_VITE_DEV_SERVER_URL}${targetPath}`;
        console.log(`[Main] Loading URL: ${url}`);
        mainWindow.loadURL(url);
    } else {
        const filePath = path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}${targetPath}`);
        console.log(`[Main] Loading File: ${filePath}`);
        mainWindow.loadFile(filePath);
    }

    mainWindow.webContents.openDevTools({ mode: 'detach' });

    // Handle minimize/restore events to toggle Avatar visibility
    mainWindow.on('minimize', () => {
        const avatarWindow = getAvatarWindow();
        if (avatarWindow && !avatarWindow.isDestroyed()) {
            avatarWindow.show();
        }
    });

    mainWindow.on('restore', () => {
        const avatarWindow = getAvatarWindow();
        if (avatarWindow && !avatarWindow.isDestroyed()) {
            avatarWindow.hide();
        }
    });

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
        const url = MAIN_WINDOW_VITE_DEV_SERVER_URL
            ? `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/views/signin/signin.html`
            : path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/views/signin/signin.html`);

        console.log(`[Main] Navigating to Signin: ${url}`);
        if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
            mainWindow.loadURL(url);
        } else {
            mainWindow.loadFile(url);
        }
    }
};

export const loadFirstCreateLoadmap = (): void => {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
        const url = MAIN_WINDOW_VITE_DEV_SERVER_URL
            ? `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/views/first_create_loadmap/first_create_loadmap.html`
            : path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/views/first_create_loadmap/first_create_loadmap.html`);

        console.log(`[Main] Navigating to First Create Loadmap: ${url}`);
        if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
            mainWindow.loadURL(url);
        } else {
            mainWindow.loadFile(url);
        }
    }
};

export const loadAvartarSelect = (): void => {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
        const url = MAIN_WINDOW_VITE_DEV_SERVER_URL
            ? `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/views/avatar_select/AvatarSelect.html`
            : path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/views/avatar_select/avatar_select.html`);

        console.log(`[Main] Navigating to First Create Loadmap: ${url}`);
        if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
            mainWindow.loadURL(url);
        } else {
            mainWindow.loadFile(url);
        }
    }
};

export const loadAvatarSetting = (): void => {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
        const url = MAIN_WINDOW_VITE_DEV_SERVER_URL
            ? `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/views/avatar_setting/Avatar_setting.html`
            : path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/views/avatar_setting/Avatar_setting.html`);

        console.log(`[Main] Navigating to Avatar Setting: ${url}`);
        if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
            mainWindow.loadURL(url);
        } else {
            mainWindow.loadFile(url);
        }
    }
};

export const loadRoadmapList = (): void => {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
        const url = MAIN_WINDOW_VITE_DEV_SERVER_URL
            ? `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/views/roadmap_list/roadmap_list.html`
            : path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/views/roadmap_list/roadmap_list.html`);

        console.log(`[Main] Navigating to Avatar Setting: ${url}`);
        if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
            mainWindow.loadURL(url);
        } else {
            mainWindow.loadFile(url);
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
        const url = MAIN_WINDOW_VITE_DEV_SERVER_URL
            ? `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/views/dashboard/dashboard.html`
            : path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/views/dashboard/dashboard.html`);

        console.log(`[Main] Navigating to Dashboard: ${url}`);
        if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
            mainWindow.loadURL(url);
        } else {
            mainWindow.loadFile(url);
        }
    }
};

export const loadProfilePage = (): void => {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
        if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
            mainWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/views/profile/profile.html`);
        } else {
            mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/views/profile/profile.html`));
        }
    }
};

export const loadSettingPage = (): void => {
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
        if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
            mainWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/views/setting/setting.html`);
        } else {
            mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/views/setting/setting.html`));
        }
    }
};
