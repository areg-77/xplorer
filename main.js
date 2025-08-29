const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

const { installExtension, VUEJS_DEVTOOLS } = require('electron-devtools-installer');

const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';

function createWindow() {
  const win = new BrowserWindow({
    show: false,
    width: 1080,
    height: 650,
    title: 'Xplorer',
    icon: 'public/icons/icon.png',
    webPreferences: {
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  if (isDev)
    win.loadURL('http://localhost:3000');
  else
    win.loadFile('dist/index.html');

  win.once('ready-to-show', () => {
    win.show();
    win.focus();
  });

  const menu = Menu.buildFromTemplate([
    ...(isMac ? [{ role: 'appMenu' }] : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        {
          role: 'zoomIn',
          accelerator: 'CmdOrCtrl+='
        },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
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
        {
          label: 'Screenshot',
          accelerator: 'F2',
          click: () => {
            const screenshotsFolder = path.join(__dirname, 'screenshots');

            if (!fs.existsSync(screenshotsFolder))
              fs.mkdirSync(screenshotsFolder, { recursive: true });

            // get list of existing screenshots matching "screenshot_N.png"
            const files = fs.readdirSync(screenshotsFolder);
            const screenshotNumbers = files
              .map(file => {
                const match = file.match(/^screenshot_(\d+)\.png$/);
                return match ? parseInt(match[1], 10) : null;
              })
              .filter(num => num !== null);

            // get next available number
            const nextNumber = (screenshotNumbers.length ? Math.max(...screenshotNumbers) : 0) + 1;
            const screenshotPath = path.join(screenshotsFolder, `screenshot_${nextNumber}.png`);

            // ave screenshot
            win.webContents.capturePage().then((image) => {
              fs.writeFile(screenshotPath, image.toPNG(), (err) => {
                if (err) {
                  console.error('failed to save screenshot:', err);
                } else {
                  console.log(`screenshot saved: screenshot_${nextNumber}.png`);
                }
              });
            });
          }
        }
      ]
    }] : [])
  ]);

  Menu.setApplicationMenu(menu);
}

app.on('ready', async () => {
  if (isDev) {
    try {
      await installExtension(VUEJS_DEVTOOLS);
      console.info(`[Vue DevTools] Installed`);
    } catch (err) {
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
