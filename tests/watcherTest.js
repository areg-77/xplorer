const { Watcher } = require('../native/build/Release/watcher.node');

const watcher = new Watcher();

watcher.on('add', (path, type) => {
  console.log(`add: ${path} [${type}]`);
});

watcher.on('delete', (path) => {
  console.log(`delete: ${path}`);
});

watcher.on('rename', (oldPath, newPath) => {
  console.log(`rename: ${oldPath} -> ${newPath}`);
});

watcher.on('move', (oldPath, newPath) => {
  console.log(`move ${oldPath} -> ${newPath}`);
});

watcher.start('D:/_ELECTRON/_XPLORER/Project');
