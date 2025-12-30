export interface IElectronAPI {
    setIgnoreMouseEvents: (ignore: boolean, options?: any) => void;
    showContextMenu: () => void;
    openSignin: () => void;
    openSignup: () => void;
    openSetting: () => void;
    openProfile: () => void;
    openRoadmapList: () => void;
    openAvartarSelect: () => void;
    openAvatarSetting: () => void;
    openFirstCreateLoadmap: () => void;
    closeSignin: () => void;
    openDashboard: () => void;
    closeDashboard: () => void;
    minimize: () => void;
    maximize: () => void;
    unmaximize: () => void;
    isMaximized: () => Promise<boolean>;
    signinSuccess: (email: string) => void;
    saveRefreshToken: (token: string) => Promise<{ success: boolean; error?: string }>;
    getRefreshToken: () => Promise<string | null>;
    deleteRefreshToken: () => Promise<{ success: boolean }>;
    log: (message: string) => void;
    syncAvatarMovement: (mouseX: number, mouseY: number) => void;
    onAvatarMovementUpdate: (callback: (mouseX: number, mouseY: number) => void) => () => void;

    // Model management
    checkModelExists: (modelName: string) => Promise<boolean>;
    downloadModel: (modelName: string, modelUrl: string) => Promise<{ success: boolean; error?: string }>;
    getModelBasePath: (modelName: string) => Promise<string>;
    onModelDownloadProgress: (callback: (progress: number) => void) => () => void;
    onOpenChat: (callback: () => void) => () => void;
    onAvatarShow: (callback: () => void) => () => void;

    // Surveillance
    cancelFinalWarning: () => void;
    getSurveillanceState: () => Promise<string | null>;
    getFinalWarningRemainingTime: () => Promise<number | null>;
    onSurveillanceFinalWarning: (callback: (data: { timeout: number; startTime: number | null }) => void) => () => void;
    onSurveillanceAbsence: (callback: () => void) => () => void;
}

declare global {
    interface Window {
        electronAPI: IElectronAPI;
    }
    const electronAPI: IElectronAPI;

    namespace Live2DCubismCore {
        type csmLogFunction = (message: string) => void;
    }
}
