const path = require('path');
const assert = require('assert');
const gulp = require('gulp');
const exec = require('child_process').exec;
const electronInstaller = require('electron-winstaller');


function getProcessArgv(key) {
  const index = process.argv.indexOf(`--${key}`);
  assert(index > -1, `Missing required argument ${key}`);
  return process.argv[index + 1];
}

function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}


const hostPlatform = require('os').platform();
const version = require('./app/package.json').version;

const appName = 'nohost';
const mirrorUrl = 'http://tnpm.oa.com/mirrors/electron/';


async function run() {
  const command = hostPlatform === 'win32' ?
    'set NODE_ENV=development&& electron ./app' :
    'NODE_ENV=development electron ./app';
  await execCommand(command);
}

async function pack() {
  const platform = getProcessArgv('platform');
  const arch = getProcessArgv('arch');
  const iconPath = platform === 'darwin' ?
    './app/assets/logo.icns' : './app/assets/logo.ico';
  const ignores = [
    './bin',
    './gulpfile.js',
    './.npmignore',
    './.eslintrc',
    './.editorconfig',
  ];
  const command = `electron-packager ./app ${appName} --out ./bin \
  --platform=${platform} --arch=${arch} --download.mirror=${mirrorUrl}\
  --overwrite --icon=${iconPath} --overwrite --rebuild\
  ${ignores.map(file => ` --ignore=${file}`).join('')}`;
  await execCommand(command);
}

function generateInstaller() {
  const platform = getProcessArgv('platform');
  const arch = getProcessArgv('arch');
  const appDirectory = path.join(__dirname, `./bin/${appName}-${platform}-${arch}`);
  const outputDirectory = path.join(__dirname, `./bin/release/v${version}/${platform}-${arch}`);
  return electronInstaller.createWindowsInstaller({
    appDirectory,
    outputDirectory,
    version,
    authors: 'Tencent Inc.',
    exe: 'Nohost.exe',
    setupIcon: path.join(__dirname, './app/assets/installer.ico'),
    setupExe: `${appName}-${platform}-${arch}(v${version}).exe`,
    setupMsi: `${appName}-${platform}-${arch}(v${version}).msi`,
  });
}


gulp.task('default', async () => await run());
gulp.task('pack', async () => await pack());
gulp.task('generateInstaller', async () => await generateInstaller());
gulp.task('release', async () => {
  await pack();
  await generateInstaller();
});
