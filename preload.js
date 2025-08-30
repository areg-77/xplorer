const { contextBridge, ipcRenderer } = require('electron');
const { Titlebar, TitlebarColor } = require('custom-electron-titlebar');

window.addEventListener('DOMContentLoaded', async () => {
  const options = {
    icon: 'icons/icon.ico',
    iconSize: 20,
    backgroundColor: TitlebarColor.fromHex('#1c1c1c'),
  };
  const titleBar = new Titlebar(options);
});

contextBridge.exposeInMainWorld("electronAPI", {
  getMimeType: (filename) => ipcRenderer.invoke('get-mime-type', filename)
});
