import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    setIgnoreMouseEvents: (ignore: boolean, options?: any) => ipcRenderer.send('set-ignore-mouse-events', ignore, options),
    showContextMenu: () => ipcRenderer.send('show-context-menu'),
    openSignin: () => ipcRenderer.send('open-signin'),
    openSignup: () => ipcRenderer.send('open-signup'),
    closeSignin: () => ipcRenderer.send('close-signin'),
    closeDashboard: () => ipcRenderer.send('close-dashboard'),
    signinSuccess: (email: string) => ipcRenderer.send('signin-success', email),
});
