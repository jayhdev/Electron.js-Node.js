const { ipcRenderer, remote } = require('electron');
const { EventEmitter } = require('events');
const log = remote.require('electron-log');
const tray = require('./tray');

// const APP_URL = 'https://app.pokerswaps.com';
const APP_URL = 'http://localhost:3000';

class WebView extends EventEmitter {
  constructor() {
    super();
    this.webviewParentElement = document.body;
    this.badge = undefined;
    this.initialize();
  }

  initialize() {
    const webviewObj = document.createElement('webview');
    this.webviewObj = webviewObj;

    log.info(`server url is ${APP_URL}`);
    webviewObj.setAttribute('server', APP_URL);
    webviewObj.setAttribute('preload', '../preload.js');
    webviewObj.setAttribute('allowpopups', 'on');
    webviewObj.setAttribute('disablewebsecurity', 'on');
    webviewObj.setAttribute(
      'class',
      process.platform === 'win32' ? 'win-webview' : ''
    );

    webviewObj.addEventListener('console-message', e => {
      log.info(e.message);
    });

    webviewObj.addEventListener('ipc-message', event => {
      this.emit(`ipc-message-${event.channel}`, event.args);
      if (event.args && event.args.length) {
        log.info(`webview args: ${event.args}`);
      }

      switch (event.channel) {
        case 'unmute':
          ipcRenderer.send('badge-show');
          break;
        case 'badge-hide':
          ipcRenderer.send('badge-hide');
          break;
        case 'unread-changed': {
          const badge = event.args[0];
          this.badge = badge;
          tray.showBadgeAndTrayAlert(badge);
          break;
        }
        case 'notification-clicked':
          remote.getCurrentWindow().show();
          break;
        case 'webview-focus':
          this.focus();
          break;
        case 'unhandledrejection':
          this.showError();
          break;
        default:
      }
    });

    webviewObj.addEventListener('did-fail-load', e => {
      log.info(
        `did-fail-load: ${e.errorcode} : ${e.errorDescription} ${e.validatedURL}`
      );

      if (e.isMainFrame && e.errorcode) {
        this.showError();
      }
    });

    webviewObj.addEventListener('crashed', () => {
      if (!this._isLoaded) {
        ipcRenderer.send('web-app-loaded');
      }
      log.info('renderer crashed on webview');

      this.showError();
    });

    webviewObj.addEventListener('did-get-response-details', e => {
      if (e.resourceType === 'mainFrame' && e.httpResponseCode >= 500) {
        this.showError();
      }
    });

    webviewObj.addEventListener('did-stop-loading', () => {
      this._isLoaded = true;
      ipcRenderer.send('web-app-loaded');

      if (this.badge) {
        setTimeout(() => {
          tray.showBadgeAndTrayAlert(this.badge);
        }, 100);
      }

      log.info('web app loaded');
    });

    webviewObj.src = APP_URL;
    this.webviewParentElement.appendChild(webviewObj);
    this.focus();
  }

  showError() {
    // TODO show error page
    console.trace();
    log.info('There was error!');
  }

  goBack() {
    this.webviewObj.goBack();
  }

  goForward() {
    this.webviewObj.goForward();
  }

  focus() {
    if (!this.webviewObj) {
      return;
    }

    this.webviewObj.focus();
    setTimeout(() => {
      tray.showBadgeAndTrayAlert(this.badge);
    }, 100);
  }

  sendToRenderer(action, payload) {
    if (!this.webviewObj) {
      log.info('webview not initialized yet to send event to renderer');
      return;
    }

    this.webviewObj.send(action, payload);
  }
}

module.exports = new WebView();
