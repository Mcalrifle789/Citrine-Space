// Citrine Space — zero-dependency terminal UI primitives for the setup wizard.
// Raw-mode keypress handling, arrow-key menus, and inputs. The focused option
// "glows white" (bold bright-white with a cyan pointer) per the spec.

import readline from 'node:readline';

const ESC = '\x1b[';
export const c = {
  reset: '\x1b[0m',
  cyan: (s) => `\x1b[38;5;45m${s}\x1b[0m`,
  dim: (s) => `\x1b[2;38;5;45m${s}\x1b[0m`,
  grey: (s) => `\x1b[38;5;244m${s}\x1b[0m`,
  glow: (s) => `\x1b[1;97m${s}\x1b[0m`,          // bold bright white — the "glow"
  white: (s) => `\x1b[97m${s}\x1b[0m`,
  amber: (s) => `\x1b[38;5;214m${s}\x1b[0m`,
  green: (s) => `\x1b[38;5;42m${s}\x1b[0m`,
  red: (s) => `\x1b[38;5;203m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

export function clear() { process.stdout.write('\x1bc'); }
function hideCursor() { process.stdout.write(`${ESC}?25l`); }
function showCursor() { process.stdout.write(`${ESC}?25h`); }

function withRawKeys(handler) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    readline.emitKeypressEvents(stdin);
    if (stdin.isTTY) stdin.setRawMode(true);
    const onKey = (str, key) => {
      const done = (val) => {
        stdin.off('keypress', onKey);
        if (stdin.isTTY) stdin.setRawMode(false);
        resolve(val);
      };
      handler(str, key, done);
    };
    stdin.on('keypress', onKey);
  });
}

export function header(step, total, title) {
  clear();
  const bar = c.dim('┄'.repeat(52));
  process.stdout.write('\n  ' + c.cyan('◆ Citrine Space') + c.grey('  ·  setup') + '\n');
  if (step) process.stdout.write('  ' + c.grey(`Step ${step} of ${total}`) + '  ' + c.glow(title) + '\n');
  process.stdout.write('  ' + bar + '\n\n');
}

/**
 * Arrow-key menu. Returns selected index (single) or array of indices (multi).
 * @param {{title?:string, items:Array<{label:string,hint?:string,checked?:boolean}>, multi?:boolean, footer?:string}} opts
 */
export function menu({ title, items, multi = false, footer } = {}) {
  return new Promise(async (resolve) => {
    let cursor = 0;
    const checked = new Set(items.map((it, i) => (it.checked ? i : -1)).filter((i) => i >= 0));
    hideCursor();

    const render = () => {
      let out = '';
      if (title) out += '  ' + c.white(title) + '\n\n';
      items.forEach((it, i) => {
        const focused = i === cursor;
        const pointer = focused ? c.cyan('❯ ') : '  ';
        let box = '';
        if (multi) box = (checked.has(i) ? c.green('◉ ') : c.grey('◯ '));
        const label = focused ? c.glow(it.label) : c.grey(it.label);
        const hint = it.hint ? '  ' + c.dim(it.hint) : '';
        out += '  ' + pointer + box + label + hint + '\n';
      });
      out += '\n  ' + c.dim(footer || (multi ? '↑↓ move · space toggle · enter confirm' : '↑↓ move · enter select')) + '\n';
      // repaint in place
      process.stdout.write('\x1b[u');       // restore cursor to saved anchor
      process.stdout.write('\x1b[0J');      // clear below
      process.stdout.write(out);
    };

    process.stdout.write('\x1b[s'); // save cursor anchor
    render();

    await withRawKeys((str, key, done) => {
      if (!key) return;
      if (key.name === 'up' || (key.name === 'k')) { cursor = (cursor - 1 + items.length) % items.length; render(); }
      else if (key.name === 'down' || key.name === 'j') { cursor = (cursor + 1) % items.length; render(); }
      else if (multi && key.name === 'space') { checked.has(cursor) ? checked.delete(cursor) : checked.add(cursor); render(); }
      else if (key.name === 'return') { showCursor(); done(multi ? [...checked].sort((a, b) => a - b) : cursor); }
      else if (key.name === 'c' && key.ctrl) { showCursor(); process.stdout.write('\n'); process.exit(130); }
    }).then(resolve);
  });
}

/**
 * Single-line text input. Supports masking with Tab-to-toggle visibility.
 * @param {{label:string, mask?:boolean, allowToggle?:boolean, value?:string, placeholder?:string}} opts
 */
export function input({ label, mask = false, allowToggle = false, value = '', placeholder = '' } = {}) {
  return new Promise(async (resolve) => {
    let buf = value;
    let hidden = mask;
    hideCursor();

    const render = () => {
      const shown = hidden ? '•'.repeat(buf.length) : buf;
      const body = buf.length ? c.glow(shown) : c.dim(placeholder);
      const toggle = allowToggle ? c.dim('   [Tab: ' + (hidden ? 'show' : 'hide') + ']') : '';
      process.stdout.write('\x1b[u\x1b[0J');
      process.stdout.write('  ' + c.white(label) + '\n\n  ' + c.cyan('❯ ') + body + c.cyan('▏') + toggle + '\n');
    };

    process.stdout.write('\x1b[s');
    render();

    await withRawKeys((str, key, done) => {
      if (!key) return;
      if (key.name === 'return') { showCursor(); done(buf); }
      else if (key.name === 'backspace') { buf = buf.slice(0, -1); render(); }
      else if (allowToggle && key.name === 'tab') { hidden = !hidden; render(); }
      else if (key.name === 'c' && key.ctrl) { showCursor(); process.exit(130); }
      else if (str && !key.ctrl && !key.meta && str >= ' ') { buf += str; render(); }
    }).then(resolve);
  });
}

export function say(msg) { process.stdout.write('  ' + msg + '\n'); }
export function pause(msg = 'Press enter to continue') {
  process.stdout.write('\n  ' + c.dim(msg) + ' ');
  return withRawKeys((str, key, done) => { if (key && key.name === 'return') done(); });
}
