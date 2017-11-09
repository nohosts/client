const http = require('http')
const { BrowserWindow } = require('electron');
const path = require('path');
const config = require('../package.json');

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
  let win = new BrowserWindow(Object.assign({
    title: config.name,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../assets/logo.png'),
  }, options));

  win.setMenu(null);
  win.loadURL(options.url);
  win.on('closed', () => win = null);

  return win;
};
