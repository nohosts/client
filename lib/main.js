const { app } = require('electron');
const path = require('path');
const url = require('url');
const { createWindow } = require('./util');

let win;
const init = () => {
  const pageUrl = url.format({
    pathname: path.join(__dirname, '../index.html'),
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

app.on('ready', init);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null) {
    init();
  }
});
