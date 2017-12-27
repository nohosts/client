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



async function run() {
  const command = hostPlatform === 'win32' ?
    'set NODE_ENV=development&& electron ./app' :
    'NODE_ENV=development electron ./app';
  await execCommand(command);
}

async function pack() {
  const command = [
    'electron-builder',
    '--config ./electron-builder.json',
  ];

  const platform = getProcessArgv('platform');
  switch (platform) {
    case 'darwin': command.push('--mac'); break;
    case 'win32': command.push('--win'); break;
    case 'linux': command.push('--linux'); break;
    default: throw new Error(`Unsupported platform ${platform}`);
  }

  const arch = getProcessArgv('arch');
  switch (arch) {
    case 'x64': command.push('--x64'); break;
    case 'ia32': command.push('--ia32'); break;
    default: throw new Error(`Unsupported arch ${platform}`);
  }

  await execCommand(command.join(' '));
}


gulp.task('default', async () => await run());
gulp.task('pack', async () => await pack());

