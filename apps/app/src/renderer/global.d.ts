export interface IElectronAPI {
    setIgnoreMouseEvents: (ignore: boolean, options?: any) => void;
    showContextMenu: () => void;
    openSignin: () => void;
    openSignup: () => void;
    openSetting: () => void;
    openProfile: () => void;
    closeSignin: () => void;
    openDashboard: () => void;
    closeDashboard: () => void;
    signinSuccess: (email: string) => void;
    saveRefreshToken: (token: string) => Promise<{ success: boolean; error?: string }>;
    getRefreshToken: () => Promise<string | null>;
    deleteRefreshToken: () => Promise<{ success: boolean }>;
    log: (message: string) => void;
    syncAvatarMovement: (mouseX: number, mouseY: number) => void;
    onAvatarMovementUpdate: (callback: (mouseX: number, mouseY: number) => void) => () => void;

    // Model management
    checkModelExists: () => Promise<boolean>;
    downloadModel: () => Promise<{ success: boolean; error?: string }>;
    getModelBasePath: () => Promise<string>;
    onModelDownloadProgress: (callback: (progress: number) => void) => () => void;
}

declare global {
    interface Window {
        electronAPI: IElectronAPI;
    }
}
