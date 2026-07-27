// Citrine Space — Electron main process. Boots the local gateway, then opens the
// frameless app window and hands the renderer the gateway port + bearer token.

import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// @ts-ignore — plain ESM shared module, bundled by electron-vite
import { createGateway } from '../../shared/gateway.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let win: BrowserWindow | null = null;
let gateway: { port: number; token: string; close: () => Promise<void> } | null = null;

async function bootGateway() {
  const gw = createGateway();
  const { port, token } = await gw.listen();
  gateway = { port, token, close: gw.close };
  // eslint-disable-next-line no-console
  console.log(`[citrine] gateway listening on http://127.0.0.1:${port}`);
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 640,
    show: false,
    frame: false,
    backgroundColor: '#05070f',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
    },
  });

  win.on('ready-to-show', () => win?.show());
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

ipcMain.handle('citrine:bootstrap', () => ({
  port: gateway?.port ?? null,
  token: gateway?.token ?? null,
  platform: process.platform,
  version: app.getVersion(),
}));

ipcMain.on('win:minimize', () => win?.minimize());
ipcMain.on('win:maximize', () => (win?.isMaximized() ? win?.unmaximize() : win?.maximize()));
ipcMain.on('win:close', () => win?.close());

app.whenReady().then(async () => {
  await bootGateway();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', async () => {
  await gateway?.close().catch(() => {});
  if (process.platform !== 'darwin') app.quit();
});
