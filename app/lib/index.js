const path = require('electron').remote.require('path');
const lan = require('lan-settings');
const startWhistle = require('whistle');
const { getPort } = require('./util');
const platform = require('electron').remote.require('os').platform();

let defaultSettingsPromise;
let defaultSettings;
let enablePromise;
let disablePromise;
let initPromise;
let proxyUrl;
let proxyPort;

const getDefaultSettings = () => {
  if (defaultSettingsPromise) {
    return defaultSettingsPromise;
  }
  defaultSettingsPromise = new Promise((resolve, reject) => {
    lan.getSettings((err, settings) => {
      if (err) {
        defaultSettingsPromise = null;
        return reject(err);
      }
      resolve(Object.assign({}, settings));
    });
  });
  return defaultSettingsPromise;
};

const enableProxy = async (port) => {
  if (!proxyUrl) {
    proxyUrl = `127.0.0.1:${port || proxyPort}`;
  }
  if (enablePromise) {
    return enablePromise;
  }
  await disablePromise;
  disablePromise = null;
  enablePromise = new Promise((resolve, reject) => {
    const settings = Object.assign({}, defaultSettings);
    settings.proxyEnable = true;
    settings.proxyServer = proxyUrl;
    settings.autoConfig = false;
    settings.autoDetect = false;
    settings.bypassLocal = false;
    settings.bypass = '';
    const callback = err => (err ? reject(err) : resolve());
    lan.setSettings(settings, callback);
  });
  return enablePromise;
};

const disableProxy = async () => {
  if (disablePromise || initPromise === undefined) {
    return disablePromise;
  }
  await enablePromise;
  enablePromise = null;
  disablePromise = lan.reset();
  return disablePromise;
};

const setup = async () => {
  defaultSettings = await getDefaultSettings();
  if (/^127\.0\.0\.1:[5|6]\d{4}$/.test(defaultSettings.proxyServer)) {
    defaultSettings.proxyServer = '';
    defaultSettings.proxyEnable = false;
  }
  const port = await getPort();
  await enableProxy(port);
  await new Promise((resolve) => {
    startWhistle({
      port,
      mode: 'pureProxy|multiEnv',
      storage: 'nohost-client',
      pluginPaths: [path.join(__dirname, '../node_modules')],
    }, resolve);
  });
  proxyPort = port;
  return proxyPort;
};

const init = async () => {
  if (proxyPort || initPromise) {
    return proxyPort || initPromise;
  }
  initPromise = setup();
  return initPromise.catch((err) => {
    initPromise = null;
    throw err;
  });
};

exports.proxyEnable = () => {
  return new Promise((resolve) => {
    lan.getSettings((err, settings) => {
      if (err) {
        enablePromise = null;
        resolve(false);
      }
      const {
        proxyEnable,
        proxyServer,
        autoDetect,
        autoConfig,
        bypassLocal,
        bypass,
      } = settings;
      if (!proxyEnable || proxyUrl !== proxyServer ||
        autoDetect || autoConfig || bypassLocal || bypass) {
        enablePromise = null;
        resolve(false);
      }
      resolve(true);
    });
  });
};

exports.enableProxy = () => {
  if (!proxyPort) {
    return init();
  }
  return enableProxy();
};

exports.disableProxy = disableProxy;
