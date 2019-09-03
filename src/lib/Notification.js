const { ipcRenderer } = require('electron');
const { getDoNotDisturb } = require('electron-notification-state');

class Notification extends window.Notification {
  constructor(title, options) {
    super(title, options);

    if (getDoNotDisturb()) {
      ipcRenderer.sendToHost('mute');
    } else {
      ipcRenderer.sendToHost('unmute');
    }

    if (process.platform === 'win32') {
      ipcRenderer.send('flash-frame');
    }
  }

  get onclick() {
    return super.onclick;
  }

  set onclick(fn) {
    super.onclick = () => {
      ipcRenderer.sendToHost('webview-focus');
      fn.apply(this, arguments);
    };
  }
}

module.exports = Notification;
