const { ipcRenderer, shell, remote } = require('electron');
const log = remote.require('electron-log');
const Notification = require('./lib/Notification');
const NullNotification = require('./lib/NullNotification');

window.ElectronNotification = Notification;
window.NullNotification = NullNotification;
window.Notification = Notification;

window.electronEnv = remote.getGlobal('electronEnv');
window.electronOS = process.platform;

const EVENTS = ['unread-changed', 'notification-clicked', 'logged-out'];

EVENTS.forEach(function(e) {
  window.addEventListener(e, function(event) {
    ipcRenderer.sendToHost(e, event.detail);
  });
});

window.onload = function() {
  log.info('preload onloaded');
  const $ = require('jquery');

  // New
  function onClickBellIcon() {
    $('.topbar-bell__button').click(function() {
      if ($('.topbar-notification__alert').length) {
        setTimeout(() => {
          ipcRenderer.sendToHost('badge-hide');
        }, 5000);
      }
    });
  }

  function removeFooter() {
    $('.footer').remove();
    onClickBellIcon();
  }

  function checkExternalUrl(e) {
    const href = $(this).attr('href');
    const external = $(this).attr('target') === '_blank';
    // @TODO double check download url
    // @TODO add download file feature
    const downloadRegex = new RegExp('/messages/(\\d+)/download');

    const mainDomainRegex = /[\w]+\.[\w]+$/;
    let mainDomain = location.host.match(mainDomainRegex) || [];
    mainDomain = mainDomain[0] || location.host;

    // Check href matching current domain
    if (
      RegExp(`^${location.protocol}//${location.host}`).test(href) &&
      !external
    ) {
      return;
    }

    // Check href matching main domain
    if (
      RegExp(`^${location.protocol}//${mainDomain}`).test(href) &&
      !external
    ) {
      return;
    }

    // Check href matching relative URL
    if (!/^([a-z]+:)?\/\//.test(href)) {
      if (external && !downloadRegex.exec(href)) {
        shell.openExternal(`${location.protocol}//${location.host}${href}`);
        e.preventDefault();
      }

      return;
    }

    if (/^https?:\/\/.+/.test(href) && !downloadRegex.exec(href)) {
      shell.openExternal(href);
      e.preventDefault();
    }
  }

  $(document).ready(removeFooter);
  $(document).on('click', 'a', checkExternalUrl);
};
