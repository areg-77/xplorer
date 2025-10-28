const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const { setupTitlebar, attachTitlebarToWindow } = require('custom-electron-titlebar/main');
const pkg = require('./package.json');
const path = require('path');
const fs = require('fs').promises;
const mime = require('mime-types');

const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';

setupTitlebar();

async function getRegionColor() {
  const cssPath = 'src/styles/global.css';
  const cssContent = await fs.readFile(cssPath, 'utf-8');

  const match = cssContent.match(/--region:\s*(.+);/);
  return match[1].trim();
}

async function createWindow() {
  const regionColor = await getRegionColor();

  const win = new BrowserWindow({
    show: false,
    width: 1080,
    height: 650,
    useContentSize: true,
    title: `Xplorer v${pkg.version}`,
    icon: path.join(__dirname, 'public', 'icons', 'icon.ico'),
    titleBarStyle: 'hidden',
    titleBarOverlay: true,
    backgroundColor: regionColor,
    webPreferences: {
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  attachTitlebarToWindow(win);

  if (isDev)
    win.loadURL('http://localhost:5705');
  else
    win.loadFile('dist/index.html');

  win.once('ready-to-show', () => {
    win.show();
    win.focus();
  });

  const menu = Menu.buildFromTemplate([
    ...(isMac ? [{ role: 'appMenu' }] : []),
    { role: 'fileMenu' },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          click: () => win.webContents.send('menu-select-all')
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        ...(isDev ? [
          { role: 'reload' },
          { role: 'forceReload' },
          { type: 'separator' },
        ] : []),
        { role: 'resetZoom' },
        {
          role: 'zoomIn',
          accelerator: 'CmdOrCtrl+='
        },
        { role: 'zoomOut' }
      ]
    },
    ...(isDev ? [{
      label: 'Developer',
      submenu: [
        { label: 'Developer Tools', role: 'toggleDevTools' },
        {
          label: 'Developer Tools (Detached)',
          click: () => {
            if (win) {
              if (win.webContents.isDevToolsOpened())
                win.webContents.closeDevTools();
              else
                win.webContents.openDevTools({ mode: 'detach' });
            }
          }
        },
        { type: 'separator' },
      ]
    }] : [])
  ]);

  Menu.setApplicationMenu(menu);
}

app.on('ready', async () => {
  if (isDev) {
    const { installExtension, VUEJS_DEVTOOLS } = require('electron-devtools-installer');

    try {
      await installExtension(VUEJS_DEVTOOLS);
      console.info(`[Vue DevTools] Installed`);
    }
    catch (err) {
      console.warn('[Vue DevTools] Failed to install:', err);
    }
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0)
      createWindow();
  });
});

app.on('window-all-closed', () => {
  if (!isMac)
    app.quit();
});

async function readFolder(dirPath) {
  const items = await fs.readdir(dirPath, { withFileTypes: true });

  const children = await Promise.all(items.map(async item => {
    const fullPath = path.join(dirPath, item.name);

    if (item.isDirectory()) {
      return {
        label: item.name,
        type: 'folder',
        children: await readFolder(fullPath)
      };
    }

    return {
      label: item.name,
      type: 'file'
    };
  }));

  return children;
}

ipcMain.handle('get-is-dev', () => isDev);

ipcMain.handle('read-folder', async (_, dirPath) => {
  return {
    label: path.basename(dirPath),
    type: 'folder',
    children: await readFolder(dirPath)
  };
});

ipcMain.handle('get-mime-type', (_, filename) => {
  return mime.lookup(filename);
});

ipcMain.on('menu-select-all', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.webContents.send('menu-select-all');
});

ipcMain.handle('explorer-delete', async (_, targetPath) => {
  const stats = await fs.stat(targetPath);

  return stats.isDirectory() ? 
    await fs.rm(targetPath, { recursive: true, force: true }) :
    await fs.unlink(targetPath)
});

ipcMain.handle('explorer-rename', async (_, oldPath, newPath) => {
  return fs.rename(oldPath, newPath);
});

ipcMain.handle('explorer-create-folder', async (_, parentPath, folderName) => {
  const newFolderPath = path.join(parentPath, folderName);
  return fs.mkdir(newFolderPath);
});
