const fixPath = require('fix-path');
const cp = require('child_process');

fixPath();

const originSpwan = cp.spawn;
cp.spawn = function(cmd, argv, options) {
  if (cmd === 'node' || cmd === 'node.exe') {
    cmd = process.execPath;
    options = options || {};
    options.env = options.env || {};
    options.env.ELECTRON_RUN_AS_NODE = '1'; // fix 电脑没有装node whistle插件跑不起来
  }
  return originSpwan.call(this, cmd, argv, options);
};
