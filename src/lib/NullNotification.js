const { remote } = require('electron');
const log = remote.require('electron-log');

class NullNotification {
  constructor(title, options) {
    log.info(
      `Null notification initialized ${title} ${JSON.stringify(options)}`
    );
  }

  get permission() {
    return 'granted';
  }

  show() {
    log.info('Null notification show called');
  }

  close() {
    log.info('Null notification close called');
  }
}

module.exports = NullNotification;
