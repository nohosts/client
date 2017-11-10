const { app } = require('electron');
const path = require('path');
const url = require('url');
const cp = require('child_process');
const { createWindow } = require('./lib/util');

let win;
const initWindow = () => {
  const pageUrl = url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true,
  });
  win = createWindow({
    url: pageUrl,
    width: 260,
    height: 150,
    minWidth: 260,
    minHeight: 150,
  });
};

const handleSquirrel = (uninstall) => {
  const updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
  const target = path.basename(process.execPath);
  const name = uninstall ? '--removeShortcut' : '--createShortcut';
  const child = cp.spawn(updateDotExe, [name, target], { detached: true });
  child.on('error', () => {});
  child.on('close', () => app.quit());
};

const handleStartupEvent = function () {
  if (process.platform !== 'win32') {
    return false;
  }
  /* eslint-disable default-case */
  switch (process.argv[1]) {
    case '--squirrel-install':
    case '--squirrel-updated':
      handleSquirrel();
      return true;
    case '--squirrel-uninstall':
      handleSquirrel(true);
      return true;
    case '--squirrel-obsolete':
      app.quit();
      return true;
  }
};


const init = () => {
  if (handleStartupEvent()) {
    return;
  }
  app.on('ready', initWindow);
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (win === null) {
      initWindow();
    }
  });
};

init();
