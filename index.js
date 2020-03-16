const path = require('path');
const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const {autoUpdater} = require('electron-updater');
const { is } = require('electron-util');
const unhandled = require('electron-unhandled');
const debug = require('electron-debug');
const contextMenu = require('electron-context-menu');
const log = require('electron-log');
const { afterMainWindow } = require('./background.custom');
const menu = require('./src/menu');

log.transports.console.level = process.env.DESKTOP_LOG_LEVEL || 'info';
log.transports.file.level = process.env.DESKTOP_LOG_LEVEL || 'info';

if (process.env.NODE_ENV === 'development') {
  require('electron-reload')(__dirname);
}

unhandled();
debug();
contextMenu();

// Note: Must match `build.appId` in package.json
app.setAppUserModelId('com.otctrade.app');

// Uncomment this before publishing your first version.
// It's commented out as it throws an error if there are no published versions.
if (!is.development) {
	// const FOUR_HOURS = 1000 * 60 * 60 * 4;
	const FOUR_HOURS = 1000 * 10;
	setInterval(() => {
		autoUpdater.checkForUpdates();
  }, FOUR_HOURS);
  log.info('------auto-update-checking---');

	autoUpdater.checkForUpdates();
}

// Prevent window from being garbage collected
let mainWindow;
let splashWindow = null;
let connectionUp = true;
let splashActive = true;

const createMainWindow = async () => {
  const win = new BrowserWindow({
    title: app.getName(),
    width: 1200,
    height: 925,
    show: false,
    icon: path.join(__dirname, 'build/icon.png'),
    frame: process.platform !== 'win32',
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true,
      devTools: true,
      // preload: path.join(__dirname, 'src/preload.js')
    }
  });

  await win.loadFile(path.join(__dirname, 'src/public/app.html'));

  return win;
};

// Prevent multiple instances of the app
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.show();
  }
});

app.on('window-all-closed', () => {
  if (!is.macos) {
    app.quit();
  }
});

(async () => {
  await app.whenReady();
  Menu.setApplicationMenu(menu);
  mainWindow = await createMainWindow();

  // mainWindow.isIntitialLoaded = false;

  splashWindow = new BrowserWindow({
    width: 300,
    height: 300,
    frame: false,
    show: false,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      devTools: false
    }
  });
  splashWindow.loadFile(path.join(__dirname, 'src/public/splash.html'));
  splashWindow.on('ready-to-show', () => {
    splashWindow.show();
  });

  ipcMain.on('connection-up', () => {
    if (!connectionUp && !splashActive) {
      log.info('Reloading main window since connection is reset');
      if (mainWindow.destroyTray) {
        mainWindow.destroyTray();
      }
      mainWindow.reload();
    }

    if (splashActive) {
      splashWindow.webContents.send('connecting');
    }

    connectionUp = true;
  });

  ipcMain.on('connection-down', () => {
    connectionUp = false;
    if (splashActive) {
      splashWindow.webContents.send('disconnected');
    }
  });

  ipcMain.on('web-app-loaded', () => {
    if (connectionUp && splashActive) {
      splashActive = false;
      splashWindow.destroy();

      mainWindow.show();
      mainWindow.isIntitialLoaded = true;

      afterMainWindow(mainWindow);
    }
  });

  ipcMain.on('badge-show', () => {
    app.dock.setBadge('.');
  });

  ipcMain.on('badge-hide', () => {
    app.setBadgeCount(0);
  })

  log.info(`Logging to: ${log.transports.file.file}`);
})();
