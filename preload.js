const { contextBridge, ipcRenderer } = require('electron');
const { Titlebar, TitlebarColor } = require('custom-electron-titlebar');
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

const watcher = require(path.join(__dirname, 'native', ...(isDev ? ['build', 'Release'] : []), 'watcher.node'));

window.addEventListener('DOMContentLoaded', async () => {
  new Titlebar({
    icon: 'icons/icon.ico',
    iconSize: 20,
    backgroundColor: TitlebarColor.fromHex('#1c1c1c'),
  });
});

contextBridge.exposeInMainWorld("electronAPI", {
  readFolder: (dir) => ipcRenderer.invoke('read-folder', dir),
  getMimeType: (filename) => ipcRenderer.invoke('get-mime-type', filename)
});

contextBridge.exposeInMainWorld('watcher', {
  start: (dir, callback) => {
    watcher.start(dir, (event, _path) => {
      _path = _path.replace(/\\/g, '/');
      const [p1, p2] = _path.split('|');
      const oldpath = p2 ? p1 : null;
      const newpath = p2 || p1;

      const data = {
        oldpath,
        path: newpath,
        basename: path.basename(newpath),
        dirname: path.dirname(newpath)
      }
      callback(event, data);
    });
  }
});
