const grunt = require('grunt');
const path = require('path');

grunt.config.init({
  pkg: grunt.file.readJSON('package.json'),
  'create-windows-installer': {
    x64: {
      appDirectory: './nohost-win32-x64',
      authors: 'avenwu',
      exe: 'nohost.exe',
      description: 'nohsot client',
      noMsi: true,
      iconUrl: path.join(__dirname, '../app/assets/logo.ico'),
      loadingGif: path.join(__dirname, '../app/assets/setup.gif'),
      setupIcon: path.join(__dirname, '../app/assets/logo.ico'),
    },
  },
});

grunt.loadNpmTasks('grunt-electron-installer');
grunt.registerTask('default', ['create-windows-installer']);
