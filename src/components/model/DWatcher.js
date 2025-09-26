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

class DWatcher {
  constructor(dirPath, options = {}) {
    this.dirPath = dirPath;
    this.buffer = [];
    this.eventDelay = options.eventDelay || 500;
    this.flushTimer = null;

    this.callbacks = {
      add: options.add || ((e) => this.logEvent('added', e)),
      delete: options.delete || ((e) => this.logEvent('deleted', e)),
      rename: options.rename || ((from, to) => this.logEvent('renamed', from, ` ${color.gray}->${color.reset} ${color.bold}${color.white}"${to.path}"${color.reset}`)),
      move: options.move || ((from, to) => this.logEvent('moved', from, ` ${color.gray}->${color.reset} ${color.bold}${color.white}"${to.path}"${color.reset}`)),
      error: options.error || ((err) => console.log(`${color.red}watcher error: ${color.gray}"${err}"${color.reset}`)),
      initialize: options.initialize || (() => console.log(`${color.gray}${color.bold}${color.blue}directory scan complete${color.reset}`))
    };

    this.watcher = chokidar.watch(this.dirPath, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true,
      usePolling: true
    });

    this.init();
  }

  isAdd(event) { return event === 'add' || event === 'addDir'; }
  isUnlink(event) { return event === 'unlink' || event === 'unlinkDir'; }

  logEvent(eventLabel, event, extra = '') {
    const colors = {
      added: color.green,
      deleted: color.red,
      renamed: color.yellow,
      moved: color.magenta
    };
    console.log(`${colors[eventLabel]}> ${eventLabel}: ${color.bold}${color.white}"${event.path}"${color.reset}${extra}`);
  }

  scheduleFlush() {
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => this.flushBuffer(), this.eventDelay);
  }

  flushBuffer() {
    const paired = new Set();

    const pairEvents = (a, b) => {
      const from = this.isUnlink(a.event) ? a : b;
      const to = this.isAdd(a.event) ? a : b;
      const eventType = path.dirname(from.path) === path.dirname(to.path) ? 'rename' : 'move';
      this.callbacks[eventType](from, to);
    };

    for (let i = 0; i < this.buffer.length; i++) {
      if (paired.has(i)) continue;
      const a = this.buffer[i];
      if (!this.isAdd(a.event) && !this.isUnlink(a.event)) continue;

      for (let j = i + 1; j < this.buffer.length; j++) {
        if (paired.has(j)) continue;
        const b = this.buffer[j];
        const isOpposite = (e1, e2) => (this.isAdd(e1) && this.isUnlink(e2)) || (this.isUnlink(e1) && this.isAdd(e2));
        if (!isOpposite(a.event, b.event)) continue;

        paired.add(i); paired.add(j);
        pairEvents(a, b);
        break;
      }
    }

    this.buffer.forEach((e, i) => {
      if (paired.has(i)) return;
      if (this.isUnlink(e.event)) {
        const parentDeleted = this.buffer.some((x, idx) => idx !== i && this.isUnlink(x.event) && e.path.startsWith(x.path));
        if (!parentDeleted) this.callbacks.delete(e);
      } else if (this.isAdd(e.event)) {
        this.callbacks.add(e);
      }
    });

    this.buffer = [];
    this.flushTimer = null;
  }

  init() {
    this.watcher
      .on('all', (event, filePath) => {
        if (this.isAdd(event) || this.isUnlink(event))
          this.buffer.push({
            event,
            path: filePath,
            basename: path.basename(filePath),
            dirname: path.dirname(filePath)
          });
        this.scheduleFlush();
      })
      .on('error', (error) => this.callbacks.error(error))
      .on('ready', () => this.callbacks.initialize());
  }
}

module.exports = { DWatcher };
