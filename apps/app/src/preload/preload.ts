import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    setIgnoreMouseEvents: (ignore: boolean, options?: any) => ipcRenderer.send('set-ignore-mouse-events', ignore, options),
    showContextMenu: () => ipcRenderer.send('show-context-menu'),
    openSignin: () => ipcRenderer.send('open-signin'),
    openAvartarSelect: () => ipcRenderer.send('open-avartar-select'),
    openFirstCreateLoadmap: () => ipcRenderer.send('open-first-create-loadmap'),
    openSignup: () => ipcRenderer.send('open-signup'),
    openDashboard: () => ipcRenderer.send('open-dashboard'),
    openSetting: () => ipcRenderer.send('open-setting'),
    openProfile: () => ipcRenderer.send('open-profile'),
    closeSignin: () => ipcRenderer.send('close-signin'),
    closeDashboard: () => ipcRenderer.send('close-dashboard'),
    signinSuccess: (email: string) => ipcRenderer.send('signin-success', email),
    saveRefreshToken: (token: string) => ipcRenderer.invoke('save-refresh-token', token),
    getRefreshToken: () => ipcRenderer.invoke('get-refresh-token'),
    deleteRefreshToken: () => ipcRenderer.invoke('delete-refresh-token'),
    log: (message: string) => ipcRenderer.send('renderer-log', message),

    // Avatar movement sync
    syncAvatarMovement: (mouseX: number, mouseY: number) => ipcRenderer.send('sync-avatar-movement', mouseX, mouseY),
    onAvatarMovementUpdate: (callback: (mouseX: number, mouseY: number) => void) => {
        const handler = (_event: Electron.IpcRendererEvent, mouseX: number, mouseY: number) => callback(mouseX, mouseY);
        ipcRenderer.on('avatar-movement-update', handler);
        // Return cleanup function
        return () => ipcRenderer.removeListener('avatar-movement-update', handler);
    },

    // Model management
    checkModelExists: () => ipcRenderer.invoke('check-model-exists'),
    downloadModel: () => ipcRenderer.invoke('download-model'),
    getModelBasePath: () => ipcRenderer.invoke('get-model-base-path'),
    onModelDownloadProgress: (callback: (progress: number) => void) => {
        const handler = (_event: Electron.IpcRendererEvent, progress: number) => callback(progress);
        ipcRenderer.on('model-download-progress', handler);
        return () => ipcRenderer.removeListener('model-download-progress', handler);
    },
});

