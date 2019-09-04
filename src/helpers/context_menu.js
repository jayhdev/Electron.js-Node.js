(function() {
  const remote = require('electron').remote;
  const Menu = remote.Menu;
  const MenuItem = remote.MenuItem;

  const isAnyTextSelected = function() {
    return window.getSelection().toString() !== '';
  };

  const cut = new MenuItem({
    label: 'Cut',
    click: function() {
      document.execCommand('cut');
    }
  });

  const copy = new MenuItem({
    label: 'Copy',
    click: function() {
      document.execCommand('copy');
    }
  });

  const paste = new MenuItem({
    label: 'Paste',
    click: function() {
      document.execCommand('paste');
    }
  });

  const normalMenu = new Menu();
  normalMenu.append(copy);

  const textEditingMenu = new Menu();
  textEditingMenu.append(cut);
  textEditingMenu.append(copy);
  textEditingMenu.append(paste);

  document.addEventListener(
    'contextmenu',
    function(e) {
      switch (e.target.nodeName) {
        case 'TEXTAREA':
        case 'INPUT':
          e.preventDefault();
          textEditingMenu.popup(remote.getCurrentWindow());
          break;
        default:
          if (isAnyTextSelected()) {
            e.preventDefault();
            normalMenu.popup(remote.getCurrentWindow());
          }
      }
    },
    false
  );
})();
