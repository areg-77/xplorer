const { contextBridge, ipcRenderer } = require('electron');
const { Titlebar, TitlebarColor } = require('custom-electron-titlebar');
const path = require('path');

(async () => {
  const isDev = await ipcRenderer.invoke('get-is-dev');

  watcher = require(path.join(__dirname, 'native', ...(isDev ? ['build', 'Release'] : []), 'watcher.node'));

  contextBridge.exposeInMainWorld('env', Object.freeze({ isDev }));
})();

window.addEventListener('DOMContentLoaded', async () => {
  new Titlebar({
    icon: 'icons/icon.ico',
    iconSize: 20,
    backgroundColor: TitlebarColor.fromHex('#1c1c1c'),
  });
});

contextBridge.exposeInMainWorld("electronAPI", {
  dirname: __dirname.replace(/\\/g, '/'),
  readFolder: (dir) => ipcRenderer.invoke('read-folder', dir),
  getMimeType: (filename) => ipcRenderer.invoke('get-mime-type', filename),
  onSelectAll: (callback) => ipcRenderer.on('menu-select-all', callback),
  sendToMain: (channel, data) => ipcRenderer.send(channel, data)
});

contextBridge.exposeInMainWorld('watcher', {
  start: (dir, callback) => {
    if (!watcher) return;
    
    watcher.start(dir, (event, _path, isDir) => {
      _path = _path.replace(/\\/g, '/');
      const [p1, p2] = _path.split('|');
      const oldpath = p2 ? p1 : null;
      const newpath = p2 || p1;

      const data = {
        oldpath,
        path: newpath,
        basename: path.basename(newpath),
        dirname: path.dirname(newpath),
        isDir
      };
      callback(event, data);
    });
  }
});

contextBridge.exposeInMainWorld("explorer", {
  delete: (targetPath) => ipcRenderer.invoke('explorer-delete', targetPath),
  rename: (oldPath, newPath) => ipcRenderer.invoke('explorer-rename', oldPath, newPath),
  createFolder: (parentPath, folderName) => ipcRenderer.invoke('explorer-create-folder', parentPath, folderName)
});
