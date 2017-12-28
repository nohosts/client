const { spawn } = require('child_process');


function test() {
  const process = spawn('node', ['./process.js']);

  process.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });
  process.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });
  process.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
}


module.exports = {
  test,
};
