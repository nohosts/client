const path = require('path');
const gulp = require('gulp');
const execSync = require('child_process').execSync;
const electronInstaller = require('electron-winstaller');


function getProcessArgv(key) {
  const index = process.argv.indexOf(`--${key}`);
  if (index > -1) {
    return process.argv[index + 1];
  }
  throw new Error(`Argument ${key} is required!`);
}


const hostPlatform = require('os').platform();
const version = require('./app/package.json').version;

const platform = getProcessArgv('platform');
const arch = getProcessArgv('arch');
const appName = 'nohost';
const mirrorUrl = 'http://tnpm.oa.com/mirrors/electron/';


function run() {
  const command = hostPlatform === 'win32' ?
    'set NODE_ENV=development&& electron ./app' :
    'NODE_ENV=development electron ./app';
  console.log(command);
  execSync(command);
}

function pack() {
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
  console.log(command);
  execSync(command);
}

async function generateInstaller() {
  const appDirectory = path.join(__dirname, `./bin/${appName}-${platform}-${arch}`);
  const outputDirectory = path.join(__dirname, `./bin/release/v${version}/${platform}-${arch}`);
  await electronInstaller.createWindowsInstaller({
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


gulp.task('default', run);
gulp.task('pack', pack);
gulp.task('generateInstaller', async () => await generateInstaller());
gulp.task('release', async () => {
  pack();
  await generateInstaller();
});
