const { app, ipcMain, session } = require('electron');
const log = require('electron-log');
const windowStateKeeper = require('./src/background/windowState');

function afterMainWindow(mainWindow) {
  app.setAsDefaultProtocolClient('pokerswaps-desktop');

  const mainWindowState = windowStateKeeper('main', {
    width: 1200,
    height: 925
  });

  mainWindow.setMinimumSize(600, 400);

  if (mainWindowState.x !== undefined && mainWindowState.y !== undefined) {
    mainWindow.setPosition(mainWindowState.x, mainWindowState.y, false);
  }
  if (
    mainWindowState.width !== undefined &&
    mainWindowState.height !== undefined
  ) {
    mainWindow.setSize(mainWindowState.width, mainWindowState.height, false);
  }

  if (mainWindowState.isMaximized) {
    mainWindow.maximize();
  }

  if (mainWindowState.isMinimized) {
    mainWindow.minimize();
  }

  mainWindow.on('close', function(event) {
    if (mainWindow.forceClose) {
      mainWindowState.saveState(mainWindow);

      return;
    }
    event.preventDefault();
    if (mainWindow.isFullScreen()) {
      mainWindow.once('leave-full-screen', () => {
        mainWindow.hide();
      });
      mainWindow.setFullScreen(false);
    } else {
      mainWindow.hide();
    }
    mainWindowState.saveState(mainWindow);
  });

  mainWindow.on('focus', () => {
    if (process.platform === 'win32') {
      mainWindow.flashFrame(false);
    }
  });

  mainWindow.on('resize', function() {
    mainWindowState.saveState(mainWindow);
  });

  mainWindow.on('move', function() {
    mainWindowState.saveState(mainWindow);
  });

  mainWindow.webContents.on('will-navigate', function(event) {
    event.preventDefault();
  });

  ipcMain.on('focus', () => {
    mainWindow.show();
    mainWindowState.saveState(mainWindow);
  });

  ipcMain.on('flash-frame', () => {
    mainWindow.flashFrame(true); // this event is only called in win32
  });

  app.on('before-quit', function() {
    log.info('saving cookie before app quits');
    session.defaultSession.cookies.flushStore(err => {
      if (err) {
        log.error(`cookie saving error: ${err.message}`);
      }
    });
    mainWindow.forceClose = true;
  });

  app.on('browser-window-blur', () => {
    log.info('saving cookie on browser window blur');
    session.defaultSession.cookies.flushStore(err => {
      if (err) {
        log.error(`cookie saving error: ${err.message}`);
      }
    });
  });

  app.on('activate', function() {
    mainWindow.show();
    mainWindowState.saveState(mainWindow);
  });
}

module.exports = {
  afterMainWindow
};
