import { app, BrowserWindow } from 'electron';
import started from 'electron-squirrel-startup';
import { createAvatarWindow } from './windows/avatarWindow';
import { createMainWindow } from './windows/mainWindow';
import { registerIpcHandlers } from './ipc';
import { createTray } from './tray';
import { startProcessMonitor } from './services/processMonitor';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

app.whenReady().then(() => {
  const avatarWindow = createAvatarWindow();
  // Start hidden, wait for signin
  avatarWindow.hide();

  // Open Main Window (Signin) immediately
  createMainWindow();

  // Register Handlers
  registerIpcHandlers();

  // Create Tray
  createTray();

  // Start Python Service
  startProcessMonitor();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createAvatarWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
