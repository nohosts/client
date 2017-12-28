
function transFunctionArgs(fn) {
  return (...args) => {
    if (args[0] === 'node') {
      args[0] = process.execPath;
    }
    return fn(...args);
  };
}


function override(cp) {
  const spawn = cp.spawn;
  cp.spawn = transFunctionArgs(spawn);

  const spawnSync = cp.spawnSync;
  cp.spawnSync = transFunctionArgs(spawnSync);
}


module.exports = {
  override,
};
