const { app, Tray, Menu, ipcMain, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const cp = require('child_process');
const { createWindow } = require('./lib/util');
const platform = require('os').platform();


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
const trayContextMenu = [
  {
    label: '启用',
    type: 'checkbox',
    checked: true,
    click: () => {
      if (win === null) {
        initWindow();
        win.hide();
      }
      win.webContents.send('switchProxy');
    },
  },
  {
    label: '显示',
    click: () => {
      win.show();
    },
  },
  {
    type: 'separator',
  },
  {
    label: '选择环境',
    type: 'normal',
    click: () => win.webContents.send('openSelectEnv'),
  },
  {
    label: '设置',
    type: 'normal',
    click: () => win.webContents.send('openSettings'),
  },
  {
    label: '帮助',
    type: 'normal',
    click: () => win.webContents.send('openHelp'),
  },
  {
    label: '退出',
    type: 'normal',
    click: () => app.quit(),
  },
];
const initTray = () => {
  tray = new Tray(path.join(__dirname, `./assets/${platform === 'darwin' ? 'tray' : 'logo'}.png`));
  tray.setToolTip('Nohost 服务运行中...');
  tray.on('click', () => {
    win.show();
    win.restore();
    win.focus();
  });
  const contextMenu = Menu.buildFromTemplate(trayContextMenu);
  tray.setContextMenu(contextMenu);
  ipcMain.on('switchProxy', (event, isActivated) => {
    tray.setImage(path.join(__dirname,
      `./assets/${platform === 'darwin' ? 'tray' : 'logo'}${!isActivated ? '-gray' : ''}.png`));
    contextMenu.items[0].checked = isActivated;
    contextMenu.items[0].label = isActivated ? '启用' : '未启用';
    contextMenu.items.slice(2, 4).forEach(item => item.enabled = isActivated);
    tray.setToolTip(`Nohost服务${isActivated ? '运行中...' : '未运行'}`);
  });
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
  if (platform !== 'win32') {
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
  if (!win) {
    return;
  }
  if (win.isMinimized()) {
    win.restore();
  }
  win.focus();
};

const initShortCut = () => {
  const closeKey = platform === 'win32' ?
    'Alt+F4' : 'CommandOrControl+W';
  const template = [{
    role: 'Window',
    submenu: [
      {
        label: 'Close',
        accelerator: closeKey,
        click: () => {
          const currentWindow = BrowserWindow.getFocusedWindow();
          if (currentWindow) {
            currentWindow.close();
          }
        },
      },
      {
        label: 'Quit',
        accelerator: 'CommandOrControl+Q',
        click: () => {
          app.quit();
        },
      },
    ],
  }];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  win.setAutoHideMenuBar(true);
};

const init = () => {
  // Quit if app is not the only instance
  const gotTheLock = app.requestSingleInstanceLock()
  if (!gotTheLock) {
    app.quit()
  } else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      makeInstanceCallback(commandLine, workingDirectory);
    })
  }


  if (handleStartupEvent()) {
    return;
  }

  app.on('ready', () => {
    initWindow();
    initTray();
    initShortCut();
  });
  app.on('window-all-closed', () => {
    if (platform !== 'darwin') {
      app.quit();
    } else {
      app.hide();
    }
  });
  app.on('activate', () => {
    if (win === null) {
      initWindow();
    }
  });
};

init();
