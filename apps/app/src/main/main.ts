import { app, BrowserWindow, protocol, net, globalShortcut } from 'electron';
import path from 'path';
import { getAvatarWindow } from './windows/manager';
import fs from 'fs';
import url from 'url';
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
  // macOS에서 Dock 표시
  if (process.platform === 'darwin') {
    app.dock.show();
  }

  // Handle local-model protocol
  protocol.handle('local-model', (request) => {
    try {
      const urlObj = new URL(request.url);
      let pathname = decodeURIComponent(urlObj.pathname);

      // Remove '/local-file' prefix if present (used to avoid Punycode issues)
      // e.g., /local-file/Hiyori/Hiyori.model3.json -> /Hiyori/Hiyori.model3.json
      if (pathname.startsWith('/local-file/')) {
        pathname = pathname.substring('/local-file'.length);
      }

      // pathname starts with '/', e.g. /Hiyori/Hiyori.model3.json
      // path.join handles the leading slash correctly
      const filePath = path.join(app.getPath('userData'), 'live2d', pathname);

      const fileUrl = url.pathToFileURL(filePath).toString();
      console.log(`[Protocol] Serving: ${request.url}`);
      console.log(`[Protocol] Decoded pathname: ${pathname}`);
      console.log(`[Protocol] Resolved path: ${filePath}`);

      if (!fs.existsSync(filePath)) {
        console.error(`[Protocol] File NOT found: ${filePath}`);
        // List directory contents for debugging
        const dirPath = path.dirname(filePath);
        if (fs.existsSync(dirPath)) {
          try {
            const files = fs.readdirSync(dirPath);
            console.error(`[Protocol] Directory contents: ${files.join(', ')}`);
          } catch (e) {
            console.error(`[Protocol] Could not read directory: ${e}`);
          }
        } else {
          console.error(`[Protocol] Directory NOT found: ${dirPath}`);
        }
        return new Response('File Not Found', { status: 404 });
      }

      return net.fetch(fileUrl);
    } catch (err: any) {
      console.error(`[Protocol] Error handling ${request.url}:`, err);
      return new Response(err.message, { status: 500 });
    }
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

  // Global Shortcut to Open Chat
  globalShortcut.register('Alt+Shift+Enter', () => {
    const avatarWindow = getAvatarWindow();
    if (avatarWindow && !avatarWindow.isDestroyed()) {
      console.log('[Main] Global Shortcut: Open Chat');
      // Ensure window can receive input by disabling click-through temporarily
      avatarWindow.setIgnoreMouseEvents(false);
      avatarWindow.moveTop();
      avatarWindow.focus();

      // Send event to renderer to open chat UI
      avatarWindow.webContents.send('open-chat-event');
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
