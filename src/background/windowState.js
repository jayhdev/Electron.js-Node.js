// Simple module to help you remember the size and position of windows.
// Can be used for more than one window, just construct many
// instances of it and give each different name.
const _ = require('lodash');
const config = require('../config');

module.exports = function(name, defaults) {
  let state = {
    width: defaults.width,
    height: defaults.height
  };

  try {
    const loadedState = config.get(`window-state-${name}`);
    if (loadedState) {
      state = loadedState;
    }
  } catch (err) {
    // For some reason json can't be read.
    // No worries, we have defaults.
  }

  const saveState = function(win) {
    if (!win.isMaximized() && !win.isMinimized() && win.isVisible()) {
      const position = win.getPosition();
      const size = win.getSize();
      state.x = position[0];
      state.y = position[1];
      state.width = size[0];
      state.height = size[1];
    }
    state.isMaximized = win.isMaximized();
    state.isMinimized = win.isMinimized();
    state.isHidden = !win.isMinimized() && !win.isVisible();
    config.set(`window-state-${name}`, state);
  };

  return {
    get x() {
      return state.x && Math.floor(state.x);
    },
    get y() {
      return state.y && Math.floor(state.y);
    },
    get width() {
      return state.width && Math.floor(state.width);
    },
    get height() {
      return state.height && Math.floor(state.height);
    },
    get isMaximized() {
      return state.isMaximized;
    },
    get isMinimized() {
      return state.isMinimized;
    },
    get isHidden() {
      return state.isHidden;
    },
    saveState: _.debounce(saveState, 1000)
  };
};
