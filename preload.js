const { contextBridge, ipcRenderer } = require('electron');
const { Titlebar, TitlebarColor } = require('custom-electron-titlebar');
const Color = require('color').default;
const path = require('path');

ipcRenderer.invoke('get-is-dev').then(isDev => {
  let watcherPath;
  if (isDev)
    watcherPath = path.join(__dirname, 'native', 'build', 'Release', 'watcher.node');
  else
    watcherPath = path.join(process.resourcesPath, 'native', 'watcher.node');

  const { Watcher } = require(watcherPath);
  const watcher = new Watcher();

  contextBridge.exposeInMainWorld('env', Object.freeze({ isDev }));
  contextBridge.exposeInMainWorld('watcher', {
    start: (dir) => watcher.start(dir),
    stop: () => watcher.stop(),
    on: (event, cb) => watcher.on(event, cb)
  });
});

window.addEventListener('DOMContentLoaded', async () => {
  const regionHSL = getComputedStyle(document.documentElement).getPropertyValue('--region-light').trim();

  new Titlebar({
    icon: 'icons/icon.ico',
    iconSize: 20,
    backgroundColor: TitlebarColor.fromHex(Color(regionHSL).hex())
  });
});

contextBridge.exposeInMainWorld("electronAPI", {
  dirname: __dirname.replace(/\\/g, '/'),
  on: (channel, callback) => {
    ipcRenderer.on(channel, (_, ...args) => callback(...args));
  },
  getMimeType: (filename) => ipcRenderer.invoke('get-mime-type', filename),
  sendToMain: (channel, data) => ipcRenderer.send(channel, data)
});

contextBridge.exposeInMainWorld("explorer", {
  basename: (filePath) => path.basename(filePath),
  dirname: (filePath) => path.dirname(filePath),
  extname: (filePath) => path.extname(filePath),
  openFolder: () => ipcRenderer.invoke('open-folder'),
  readFolder: (dir) => ipcRenderer.invoke('read-folder', dir),
  delete: (targetPath) => ipcRenderer.invoke('explorer-delete', targetPath),
  rename: (oldPath, newPath) => ipcRenderer.invoke('explorer-rename', oldPath, newPath),
  createFolder: (parentPath, folderName) => ipcRenderer.invoke('explorer-create-folder', parentPath, folderName)
});
