const http = require('http');
const { BrowserWindow } = require('electron');
const path = require('path');

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
    icon: path.join(__dirname, '../assets/logo.png'),
    webPreferences:{
      nodeIntegration: true
    }
  }, options));
  win.removeMenu();
  win.loadURL(options.url);
  if (isDev) {
    win.openDevTools();
  }
  win.on('minimize', () => {
    win.hide();
  });
  return win;
};
