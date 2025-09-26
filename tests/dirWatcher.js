const chokidar = require('chokidar');
const nodePath = require('path');

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

const RENAME_WINDOW_MS = 500;
let buffer = [];
let flushTimer = null;

function scheduleFlush() {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushBuffer, RENAME_WINDOW_MS);
}

function isAdd(evt) {
  return evt === 'add' || evt === 'addDir';
}

function isUnlink(evt) {
  return evt === 'unlink' || evt === 'unlinkDir';
}

function flushBuffer() {
  const paired = new Set();

  for (let i = 0; i < buffer.length; i++) {
    if (paired.has(i)) continue;
    const a = buffer[i];
    if (!isAdd(a.event) && !isUnlink(a.event)) continue;

    for (let j = i + 1; j < buffer.length; j++) {
      if (paired.has(j)) continue;
      const b = buffer[j];
      if (!((isAdd(a.event) && isUnlink(b.event)) || (isUnlink(a.event) && isAdd(b.event)))) continue;

      const from = isUnlink(a.event) ? a : b;
      const to   = isAdd(a.event) ? a : b;

      // ✅ First check: same basename
      if (nodePath.basename(from.path) === nodePath.basename(to.path)) {
        const label = nodePath.dirname(from.path) === nodePath.dirname(to.path) ? 'renamed' : 'moved';
        console.log(`${color.gray}[${eventCount}] ${color.yellow}> ${label}: ${color.bold}${color.white}"${from.path}"${color.reset} ${color.gray}->${color.reset} ${color.bold}${color.white}"${to.path}"${color.reset}`);
        paired.add(i); paired.add(j);
        break;
      }
    }
  }

  // Second pass: pair remaining (different basenames, true renames/moves)
  for (let i = 0; i < buffer.length; i++) {
    if (paired.has(i)) continue;
    const a = buffer[i];
    if (!isAdd(a.event) && !isUnlink(a.event)) continue;

    for (let j = i + 1; j < buffer.length; j++) {
      if (paired.has(j)) continue;
      const b = buffer[j];
      if (!((isAdd(a.event) && isUnlink(b.event)) || (isUnlink(a.event) && isAdd(b.event)))) continue;

      const from = isUnlink(a.event) ? a : b;
      const to   = isAdd(a.event) ? a : b;

      const label = nodePath.dirname(from.path) === nodePath.dirname(to.path) ? 'renamed' : 'moved';
      console.log(`${color.gray}[${eventCount}] ${color.yellow}> ${label}: ${color.bold}${color.white}"${from.path}"${color.reset} ${color.gray}->${color.reset} ${color.bold}${color.white}"${to.path}"${color.reset}`);
      paired.add(i); paired.add(j);
      break;
    }
  }

  // Unpaired leftovers
  for (let k = 0; k < buffer.length; k++) {
    if (paired.has(k)) continue;
    const e = buffer[k];

    // If it's a file/dir inside a deleted parent, skip
    if (isUnlink(e.event)) {
      const parentDeleted = buffer.some((x, idx) =>
        idx !== k &&
        isUnlink(x.event) &&
        nodePath.dirname(e.path).startsWith(x.path) &&
        nodePath.basename(x.path) !== nodePath.basename(e.path) // ensure not the same item
      );
      if (parentDeleted) continue; // skip child deletions
    }

    if (isAdd(e.event)) {
      console.log(`${color.gray}[${eventCount}] ${color.green}+ added: ${color.bold}${color.white}"${e.path}"${color.reset}`);
    } else if (isUnlink(e.event)) {
      console.log(`${color.gray}[${eventCount}] ${color.red}- deleted: ${color.bold}${color.white}"${e.path}"${color.reset}`);
    } else if (e.event === 'change') {
      console.log(`${color.gray}[${eventCount}] ${color.magenta}~ changed: ${color.bold}${color.white}"${e.path}"${color.reset}`);
    }
  }

  buffer = [];
  flushTimer = null;
}

watcher
  .on('all', (event, filePath) => {
    if (event) eventCount++;
    
    if (event === 'change') {
      console.log(`${color.gray}[${eventCount}] ${color.magenta}~ changed: ${color.bold}${color.white}"${filePath}"${color.reset}`);
      return;
    }

    buffer.push({ event, path: filePath });
    scheduleFlush();
  })
  .on('error', error => console.log(`${color.red}! watcher error: ${color.gray}"${error}"${color.reset}`))
  .on('ready', () => console.log(`${color.gray}[${eventCount}] ${color.bold}${color.blue}directory scan complete${color.reset}`));
