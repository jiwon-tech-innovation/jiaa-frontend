import { BrowserWindow } from 'electron';

let mainWindow: BrowserWindow | null = null;
let avatarWindow: BrowserWindow | null = null;

export function getMainWindow(): BrowserWindow | null {
    return mainWindow;
}

export function setMainWindow(window: BrowserWindow | null): void {
    mainWindow = window;
}

export function getAvatarWindow(): BrowserWindow | null {
    return avatarWindow;
}

export function setAvatarWindow(window: BrowserWindow | null): void {
    avatarWindow = window;
}

// Helper function to show avatar window and trigger token refresh in renderer
export function showAvatarWindowWithAuth(): void {
    if (avatarWindow && !avatarWindow.isDestroyed()) {
        avatarWindow.show();
        // Send event to trigger token refresh in renderer
        avatarWindow.webContents.send('avatar-show');
    }
}
