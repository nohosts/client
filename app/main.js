const { app, Tray } = require('electron');
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
  win.on('closed', () => win = null);
};

let tray;
const initTray = () => {
  tray = new Tray(path.join(__dirname, './assets/logo.png'));
  tray.setToolTip('Nohost 运行中...');
  tray.on('click', () => {
    win.show();
    win.restore();
    win.focus();
  });
  // Todo: Support context menu
  // const contextMenu = Menu.buildFromTemplate([
  //   {label: 'Item1', type: 'radio'}
  // ])
  // tray.setContextMenu(contextMenu)
};

const handleSquirrel = (uninstall) => {
  const updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
  const target = path.basename(process.execPath);
  const name = uninstall ? '--removeShortcut' : '--createShortcut';
  const child = cp.spawn(updateDotExe, [name, target], { detached: true });
  child.on('error', () => {
  });
  child.on('close', () => app.quit());
};

const handleStartupEvent = () => {
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

const makeInstanceCallback = () => {
  if (!win) { return; }
  if (win.isMinimized()) { win.restore(); }
  win.focus();
};

const init = () => {
  // Quit if app is not the only instance
  const isSecondInstance = app.makeSingleInstance(makeInstanceCallback);
  if (isSecondInstance) {
    app.quit();
  }

  if (handleStartupEvent()) {
    return;
  }

  app.on('ready', () => {
    initWindow();
    initTray();
  });
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
