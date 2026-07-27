// Citrine Space — preload bridge. Exposes a tiny, safe surface to the renderer:
// gateway bootstrap info and window controls. No Node or secrets leak through.

import { contextBridge, ipcRenderer } from 'electron';

const api = {
  bootstrap: (): Promise<{ port: number | null; token: string | null; platform: string; version: string }> =>
    ipcRenderer.invoke('citrine:bootstrap'),
  window: {
    minimize: () => ipcRenderer.send('win:minimize'),
    maximize: () => ipcRenderer.send('win:maximize'),
    close: () => ipcRenderer.send('win:close'),
  },
};

contextBridge.exposeInMainWorld('citrine', api);

export type CitrineBridge = typeof api;
