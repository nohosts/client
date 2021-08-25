const http = require('http');
const { BrowserWindow } = require('electron');
const path = require('path');
const os = require('os');
const cp = require('child_process');
const sudo = require('sudo-prompt');

const isDev = process.env.NODE_ENV === 'development';

let curPort = 55001;

const checkPort = (port) => {
  const server = http.createServer();
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, () => {
      server.removeAllListeners();
      server.close(() => {
        resolve(port);
      });
    });
  });
};

const getPort = (callback) => {
  Promise.all([
    checkPort(curPort),
    checkPort(curPort + 1),
    checkPort(curPort + 2),
    checkPort(curPort + 3),
  ]).then((([port]) => callback(port))).catch(() => {
    curPort += 5;
    getPort(callback);
  });
};

exports.getPort = () => {
  return new Promise(resolve => getPort(resolve));
};

exports.createWindow = (options) => {
  const win = new BrowserWindow(Object.assign({
    title: 'Nohost',
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../assets/nohost.png'),
    webPreferences: {
      nodeIntegration: true,
    },
  }, options));
  win.removeMenu();
  if (options.url) {
    win.loadURL(options.url);
  }
  if (isDev) {
    win.openDevTools();
  }
  win.on('minimize', () => {
    win.hide();
  });
  return win;
};

const systemType = os.type();
exports.isMacOs = systemType === 'Darwin';

const sudoOptions = {
  name: 'Nohost',
};

exports.exec = (command, isSudo) => {
  return new Promise((resolve, reject) => {
    if (isSudo) {
      sudo.exec(command, sudoOptions, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else if (stderr) {
          reject(stderr);
        } else {
          resolve(stdout);
        }
      });
    } else {
      cp.exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else if (stderr) {
          reject(stderr);
        } else {
          resolve(stdout);
        }
      });
    }
  });
};
