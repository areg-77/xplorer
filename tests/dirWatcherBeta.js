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

const folderPath = process.argv[2];

const watcher = chokidar.watch(folderPath, {
  ignored: /(^|[\/\\])\../,
  persistent: true,
  ignoreInitial: true,
  usePolling: true,
  interval: 1000
});

const RENAME_WINDOW_MS = 500;
let buffer = [];
let flushTimer = null;

const isAdd = e => e === 'add' || e === 'addDir';
const isUnlink = e => e === 'unlink' || e === 'unlinkDir';

function logEvent(label, e, extra = '') {
  const colors = { added: color.green, deleted: color.red, renamed: color.yellow, moved: color.yellow };
  console.log(`${colors[label]}> ${label}: ${color.bold}${color.white}"${e.path}"${color.reset}${extra}`);
}

function scheduleFlush() {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushBuffer, RENAME_WINDOW_MS);
}

function flushBuffer() {
  const paired = new Set();

  function pairEvents(a, b) {
    const from = isUnlink(a.event) ? a : b;
    const to   = isAdd(a.event) ? a : b;
    const label = path.dirname(from.path) === path.dirname(to.path) ? 'renamed' : 'moved';
    logEvent(label, from, ` ${color.gray}->${color.reset} ${color.bold}${color.white}"${to.path}"${color.reset}`);
    return [from, to];
  }

  // First pass: match by basename, then fallback for any remaining
  for (let i = 0; i < buffer.length; i++) {
    if (paired.has(i)) continue;
    const a = buffer[i];
    if (!isAdd(a.event) && !isUnlink(a.event)) continue;

    for (let j = i + 1; j < buffer.length; j++) {
      if (paired.has(j)) continue;
      const b = buffer[j];
      if (!((isAdd(a.event) && isUnlink(b.event)) || (isUnlink(a.event) && isAdd(b.event)))) continue;

      paired.add(i); paired.add(j);
      pairEvents(a, b);
      break;
    }
  }

  // Handle unpaired leftovers
  buffer.forEach((e, k) => {
    if (paired.has(k)) return;
    if (isUnlink(e.event)) {
      const parentDeleted = buffer.some((x, idx) =>
        idx !== k && isUnlink(x.event) &&
        path.dirname(e.path).startsWith(x.path) &&
        path.basename(x.path) !== path.basename(e.path)
      );
      if (parentDeleted) return;
      logEvent('deleted', e);
    } else if (isAdd(e.event)) {
      logEvent('added', e);
    }
  });

  buffer = [];
  flushTimer = null;
}

watcher
  .on('all', (event, filePath) => {
    if (isAdd(event) || isUnlink(event)) buffer.push({ event, path: filePath })
    scheduleFlush();
  })
  .on('error', err => console.log(`${color.red}! watcher error: ${color.gray}"${err}"${color.reset}`))
  .on('ready', () => console.log(`${color.gray}${color.bold}${color.blue}directory scan complete${color.reset}`));
