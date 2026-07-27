#!/usr/bin/env node
// Citrine Space launcher.
//   citrine space          → start the gateway + open the Citrine Space app
//   citrine space setup    → run the 5-step setup wizard
//   citrine space --help    → usage
//
// The gateway itself lives in the Electron main process; launching the app starts it.

import { spawnSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { c } from '../cli/tui.mjs';
import { isConfigured, paths } from '../shared/config.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const argv = process.argv.slice(2);

// Accept `citrine space ...` (and, for convenience, a bare `citrine ...` via npm scripts).
const args = argv[0] === 'space' ? argv.slice(1) : argv;
const cmd = args[0] || 'start';

function banner() {
  process.stdout.write('\n  ' + c.cyan('◆ Citrine Space') + c.grey('  — local-first personal AI agent') + '\n\n');
}

function usage() {
  banner();
  console.log('  ' + c.white('Usage:'));
  console.log('    ' + c.glow('citrine space setup') + c.grey('   Configure account, providers, search & audio'));
  console.log('    ' + c.glow('citrine space') + c.grey('         Start the gateway and open the app'));
  console.log('    ' + c.glow('citrine space --help') + c.grey('   Show this help'));
  console.log('');
}

async function doSetup() {
  const { runSetup } = await import('../cli/setup-wizard.mjs');
  await runSetup();
}

function findElectronVite() {
  const bin = process.platform === 'win32' ? 'electron-vite.cmd' : 'electron-vite';
  const p = path.join(ROOT, 'node_modules', '.bin', bin);
  return fs.existsSync(p) ? p : null;
}

async function startApp() {
  if (!isConfigured()) {
    banner();
    console.log('  ' + c.amber('No configuration found yet.'));
    console.log('  Run ' + c.glow('citrine space setup') + ' first to add your account and provider keys.\n');
    console.log('  ' + c.dim('Config will be stored at ' + paths().dir) + '\n');
    process.exit(1);
  }

  const ev = findElectronVite();
  if (!ev) {
    banner();
    console.log('  ' + c.amber('Dependencies not installed.'));
    console.log('  Run ' + c.glow('npm install') + ' in ' + c.white(ROOT) + ' then try again.\n');
    process.exit(1);
  }

  const built = fs.existsSync(path.join(ROOT, 'out', 'main', 'index.js'));
  const mode = built ? 'preview' : 'dev';
  banner();
  console.log('  ' + c.green('Starting gateway and opening Citrine Space…') + c.dim(`  (${mode})`) + '\n');
  // Launch electron-vite via the shell (needed for the .cmd shim on Windows). The command
  // path can contain spaces (…\Terminal GUIs\…), so quote it and inline the mode — passing
  // an args array with shell:true would leave the path unquoted and split on the space.
  const child = spawn(`"${ev}" ${mode}`, { cwd: ROOT, stdio: 'inherit', shell: true });
  child.on('exit', (code) => process.exit(code || 0));
}

(async () => {
  try {
    if (cmd === 'setup') return await doSetup();
    if (cmd === '--help' || cmd === '-h' || cmd === 'help') return usage();
    if (cmd === 'start' || cmd === undefined) return await startApp();
    // Unknown → treat as start with a note.
    usage();
  } catch (err) {
    console.error('\n  ' + c.red('Error: ') + (err?.stack || err?.message || String(err)) + '\n');
    process.exit(1);
  }
})();
