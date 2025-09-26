const chokidar = require('chokidar');

const color = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  blue: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

const folderPath = process.argv[2];

const watcher = chokidar.watch(folderPath, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: true,
  usePolling: true,
  interval: 1000
});

let eventCount = 0;

watcher
  .on('all', (event, path) => {
    if (event)
      eventCount++;
    
    if (event === 'add' || event === 'addDir') {
      console.log(`${color.gray}[${eventCount}] ${color.green}+ added: ${color.bold}${color.white}"${path}"${color.reset}`);
    }
    if (event === 'unlink' || event === 'unlinkDir') {
      console.log(`${color.gray}[${eventCount}] ${color.red}- deleted: ${color.bold}${color.white}"${path}"${color.reset}`);
    }
    if (event === 'change') {
      console.log(`${color.gray}[${eventCount}] ${color.magenta}~ changed: ${color.bold}${color.white}"${path}"${color.reset}`);
    }
  })
  .on('error', error => console.log(`${color.red}! watcher error: ${color.gray}"${error}"${color.reset}`))
  .on('ready', () => console.log(`${color.gray}[${eventCount}] ${color.bold}${color.blue}directory scan complete${color.reset}`));
