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
