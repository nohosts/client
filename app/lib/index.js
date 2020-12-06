const path = require('electron').remote.require('path');
const fs = require('fs-extra-promise');
const lan = require('lan-settings');
const startWhistle = require('whistle');
const { getPort, isMacOs, exec } = require('./util');
const platform = require('electron').remote.require('os').platform();
require('./polyfill');

const PROXY_CONF_HELPER_PATH = path.join(__dirname, '../assets/proxy_conf_helper');
const PROXY_CONF_HELPER_FILE_PATH = path.join(__dirname, '../assets/files/proxy_conf_helper');

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

const enableMacProxy = async (port) => {
  if (!proxyUrl) {
    proxyUrl = `127.0.0.1:${port || proxyPort}`;
  }
  port = proxyUrl.split(':')[1];
  if (enablePromise) {
    return enablePromise;
  }
  await disablePromise;
  disablePromise = null;
  const command = `'${PROXY_CONF_HELPER_PATH}' -m global -p ${port} -r ${port} -s 127.0.0.1`;
  enablePromise = exec(command);
  return enablePromise;
};

const disableProxy = async () => {
  if (disablePromise || initPromise === undefined) {
    return disablePromise;
  }
  await enablePromise;
  enablePromise = null;
  const command = `'${PROXY_CONF_HELPER_PATH}' -m off`;
  disablePromise = isMacOs ? exec(command) : lan.reset();
  return disablePromise;
};

async function checkHelperInstall() {
  if (!isMacOs) {
    return true;
  }
  if (!(await fs.existsAsync(PROXY_CONF_HELPER_PATH))) {
    return false;
  }
  const info = await fs.statAsync(PROXY_CONF_HELPER_PATH);
  if (info.uid === 0) {
    // 已经安装
    return true;
  }
  return false;
}

const installProxyHelper = async () => {
  if (await checkHelperInstall()) { return true; }
  // 通过文件复制来判断是否授权过root
  const command = `cp "${PROXY_CONF_HELPER_FILE_PATH}" "${PROXY_CONF_HELPER_PATH}" && chown root:admin "${PROXY_CONF_HELPER_PATH}" && chmod a+rx+s "${PROXY_CONF_HELPER_PATH}"`;
  return exec(command, true);
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

const macSetup = async () => {
  const port = await getPort();
  await installProxyHelper(port);
  await enableMacProxy(port);
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
  initPromise = isMacOs ? macSetup() : setup();
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
      if (!proxyEnable || proxyServer.indexOf(proxyUrl) === -1
        || autoDetect || autoConfig || bypassLocal || bypass) {
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
  return isMacOs ? enableMacProxy() : enableProxy();
};

exports.disableProxy = disableProxy;
