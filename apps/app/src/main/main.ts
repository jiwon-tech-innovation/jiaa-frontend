import { app, BrowserWindow, protocol, net } from 'electron';
import path from 'path';
import started from 'electron-squirrel-startup';
import { createAvatarWindow } from './windows/avatarWindow';
import { createMainWindow } from './windows/mainWindow';
import { registerIpcHandlers } from './ipc';
import { createTray } from './tray';
import { startProcessMonitor } from './services/processMonitor';

// Register custom protocol as privileged
protocol.registerSchemesAsPrivileged([
  { scheme: 'local-model', privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

app.whenReady().then(() => {
  // Handle local-model protocol
  protocol.handle('local-model', (request) => {
    const modelPath = request.url.slice('local-model://'.length);
    const filePath = path.join(app.getPath('userData'), 'live2d', decodeURIComponent(modelPath));
    return net.fetch('file://' + filePath);
  });

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
