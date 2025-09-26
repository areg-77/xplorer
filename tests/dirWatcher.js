const chokidar = require('chokidar');
const path = require('path');

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

const dirPath = process.argv[2];

const watcher = chokidar.watch(dirPath, {
  ignored: /(^|[\/\\])\../,
  persistent: true,
  ignoreInitial: true,
  usePolling: true
});

let buffer = [];
const eventDelay = 500;
flushTimer = null;

const isAdd = event => (event === 'add' || event === 'addDir');
const isUnlink = event => (event === 'unlink' || event === 'unlinkDir');

function logEvent(eventLabel, event, extra = '') {
  const colors = {
    added: color.green,
    deleted: color.red,
    renamed: color.yellow,
    moved: color.magenta
  };
  console.log(`${colors[eventLabel]}> ${eventLabel}: ${color.bold}${color.white}"${event.path}"${color.reset}${extra}`);
}

function scheduleFlush() {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushBuffer, eventDelay);
}

function flushBuffer() {
  const paired = new Set()

  function pairEvents(a, b) {
    const from = isUnlink(a.event) ? a : b;
    const to = isAdd(a.event) ? a : b;

    const eventLabel = path.dirname(from.path) === path.dirname(to.path) ? 'renamed' : 'moved';
    logEvent(eventLabel, from, ` ${color.gray}->${color.reset} ${color.bold}${color.white}"${to.path}"${color.reset}`);
  }

  for (let i = 0; i < buffer.length; i++) {
    if (paired.has(i)) continue;
    const a = buffer[i];
    if (!isAdd(a.event) && !isUnlink(a.event)) continue;

    for (let j = i + 1; j < buffer.length; j++) {
      if (paired.has(j)) continue;
      const b = buffer[j];
      const isOpposite = (e1, e2) => (isAdd(e1) && isUnlink(e2)) || (isUnlink(e1) && isAdd(e2));
      if (!isOpposite(a.event, b.event)) continue;

      paired.add(i); paired.add(j);
      pairEvents(a, b);
      break;
    }
  }

  buffer.forEach((e, i) => {
    if (paired.has(i)) return;
    if (isUnlink(e.event)) {
      const parentDeleted = buffer.some((x, idx) => idx !== i && isUnlink(x.event) && e.path.startsWith(x.path));
      if (!parentDeleted) logEvent('deleted', e);
    }
    else if (isAdd(e.event))
      logEvent('added', e);
  });

  buffer = [];
  flushTimer = null;
}

watcher
  .on('all', (event, filePath) => {
    if (isAdd(event) || isUnlink(event)) buffer.push({ event, path: filePath });
    scheduleFlush();
  })
  .on('error', error => console.log(`${color.red}watcher error: ${color.gray}"${error}"${color.reset}`))
  .on('ready', () => console.log(`${color.gray}${color.bold}${color.blue}directory scan complete${color.reset}`));
