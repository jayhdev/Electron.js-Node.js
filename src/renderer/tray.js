const { remote } = require('electron');
const path = require('path');
const log = require('electron-log');

const { Tray, Menu } = remote;

const mainWindow = remote.getCurrentWindow();

const icons = {
  win32: {
    dir: 'windows'
  },
  darwin: {
    dir: 'osx'
  }
};

const _iconTray = path.join(
  __dirname,
  'images',
  icons[process.platform].dir,
  icons[process.platform].icon || 'icon-tray.png'
);
const _iconTrayAlert = path.join(
  __dirname,
  'images',
  icons[process.platform].dir,
  icons[process.platform].iconAlert || 'icon-tray-alert.png'
);

function createAppTray() {
  const _tray = new Tray(_iconTray);
  mainWindow.tray = _tray;

  const focusWindow = () => {
    log.info('tray: Focusing on main window');

    if (!mainWindow.isIntitialLoaded) {
      log.info(
        'tray: main window is not initially loaded yet. ignoring focus request.'
      );
      return;
    }

    if (mainWindow.noTeams) {
      log.info('tray: no teams yet. ignoring focus request');
      return;
    }

    mainWindow.show();

    // trigger focus and show badge
    if (
      mainWindow.webContents &&
      typeof mainWindow.webContents.executeJavascript === 'function'
    ) {
      mainWindow.webContents.executeJavascript(
        `window.dispatchEvent(new CustomEvent("webview-focus");`
      );
    }
  };

  const contextMenuShow = Menu.buildFromTemplate([
    {
      label: 'Show',
      click() {
        focusWindow();
      }
    },
    {
      label: 'Quit',
      click() {
        remote.app.quit();
      }
    }
  ]);

  const contextMenuHide = Menu.buildFromTemplate([
    {
      label: 'Hide',
      click() {
        mainWindow.hide();
      }
    },
    {
      label: 'Quit',
      click() {
        remote.app.quit();
      }
    }
  ]);

  if (!mainWindow.isMinimized() && !mainWindow.isVisible()) {
    _tray.setContextMenu(contextMenuShow);
  } else {
    _tray.setContextMenu(contextMenuHide);
  }

  const onShow = function() {
    _tray.setContextMenu(contextMenuHide);
  };

  const onHide = function() {
    _tray.setContextMenu(contextMenuShow);
  };

  mainWindow.on('show', onShow);
  mainWindow.on('restore', onShow);

  mainWindow.on('hide', onHide);
  mainWindow.on('minimize', onHide);

  _tray.setToolTip(remote.app.getName());

  _tray.on('right-click', function(e, b) {
    _tray.popUpContextMenu(undefined, b);
  });

  _tray.on('click', () => {
    if (mainWindow.isVisible()) {
      return mainWindow.hide();
    }

    focusWindow();
  });

  mainWindow.destroyTray = function() {
    mainWindow.removeListener('show', onShow);
    mainWindow.removeListener('hide', onHide);
    _tray.destroy();
  };
}

function setOverlayIconWin32(text) {
  let _icon = path.join(__dirname, 'images', 'windows', `icon-${text}.png`);
  if (text.length > 1) {
    _icon = path.join(__dirname, 'images', 'windows', 'icon-9Plus.png');
  }

  mainWindow.setOverlayIcon(remote.nativeImage.createFromPath(_icon), text);
}

function showBadgeAndTrayAlert(badge) {
  switch (process.platform) {
    // Hard Remove unread icon on windows
    // Flash Frame
    case 'win32':
      if (badge) {
        mainWindow.tray.setImage(_iconTrayAlert);
      } else {
        mainWindow.tray.setImage(_iconTray);
      }

      if (badge && badge !== '•') {
        setOverlayIconWin32(badge);
      } else {
        mainWindow.setOverlayIcon(null, '');
      }
      break;

    default:
      break;
  }
}

if (process.platform !== 'darwin') {
  createAppTray();
}

module.exports = {
  showBadgeAndTrayAlert
};
