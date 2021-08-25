const { ipcRenderer } = require('electron');

window.enableProxy = () => {
  ipcRenderer.send('switchProxy', true);
};

window.disableProxy = () => {
  ipcRenderer.send('switchProxy', false);
};
