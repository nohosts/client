const path = require('path');
const lan = require('lan-settings');
const startWhistle = require('whistle');
const { getPort } = require('./util');

let defaultSettingsPromise;
let defaultSettings;
let enablePromise;
let disablePromise;
let initPromise;
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
      resolve(settings);
    });
  });
  return defaultSettingsPromise;
};

const enableProxy = async (port) => {
  if (enablePromise) {
    return enablePromise;
  }
  await disablePromise;
  disablePromise = null;
  enablePromise = new Promise((resolve, reject) => {
    lan.setSettings({
      proxyEnable: true,
      proxyServer: `127.0.0.1:${port || proxyPort}`,
    }, err => (err ? reject(err) : resolve()));
  });
  return enablePromise;
};

const disableProxy = async () => {
  if (disablePromise || initPromise === undefined) {
    return disablePromise;
  }
  await enablePromise;
  enablePromise = null;
  disablePromise = new Promise((resolve, reject) => {
    const callback = err => (err ? reject(err) : resolve());
    if (defaultSettings) {
      lan.setSettings(defaultSettings, callback);
    } else {
      lan.reset(callback);
    }
  });
  return disablePromise;
};

const setup = async () => {
  defaultSettings = await getDefaultSettings();
  if (/^127\.0\.0\.1:[5|6]\d{4}$/.test(defaultSettings.proxyServer)) {
    defaultSettings.proxyServer = '';
    defaultSettings.proxyEnable = false;
  } else {
    defaultSettings = null;
  }
  const port = await getPort();
  await enableProxy(port);
  await new Promise((resolve) => {
    startWhistle({
      port,
      mode: 'pureProxy',
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

exports.enableProxy = () => {
  if (!proxyPort) {
    return init();
  }
  return enableProxy();
};

exports.disableProxy = disableProxy;

