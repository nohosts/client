
const path = require('path');
const fs = require('fs');
const platform = require('os').platform();

const fileName = `node${platform === 'win32' ? '.exe' : ''}`;
const from = path.join(__dirname, `./bin/${platform}/${fileName}`);
const to = path.join(__dirname, `./app/bin/${fileName}`);

const binPath = path.join(__dirname, './app/bin/');
if (fs.existsSync(binPath)) {
  fs.readdirSync(binPath).forEach((file) => {
    fs.unlinkSync(path.join(binPath, file));
  });
} else {
  fs.mkdirSync(binPath);
}

fs.copyFileSync(from, to);
