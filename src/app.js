const { ipcRenderer, remote } = require('electron');
const webview = require('../renderer/webview');
const log = remote.require('electron-log');

function start() {
  log.info('start checking connection status...');

  // connection check
  function online() {
    log.info('connection up');
    log.info('recovering from offline');
    ipcRenderer.send('connection-up');
  }

  function offline() {
    log.info('connection down');
    ipcRenderer.send('connection-down');
  }

  if (navigator.onLine) {
    log.info('navigator online');
    ipcRenderer.send('connection-up');
  } else {
    offline();
  }

  window.addEventListener('online', online);
  window.addEventListener('offline', offline);
  window.addEventListener('focus', function() {
    webview.focus();
  });
}

start();
