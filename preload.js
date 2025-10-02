const { contextBridge, ipcRenderer } = require('electron');
const { Titlebar, TitlebarColor } = require('custom-electron-titlebar');

window.addEventListener('DOMContentLoaded', async () => {
  new Titlebar({
    icon: 'icons/icon.ico',
    iconSize: 20,
    backgroundColor: TitlebarColor.fromHex('#1c1c1c'),
  });
});

contextBridge.exposeInMainWorld("electronAPI", {
  readFolder: (dirPath) => ipcRenderer.invoke('read-folder', dirPath),
  getMimeType: (filename) => ipcRenderer.invoke('get-mime-type', filename)
});
