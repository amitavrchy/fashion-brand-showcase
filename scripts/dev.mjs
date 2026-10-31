import { spawn, execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const children = [
  spawn(process.execPath, ['node_modules/@nestjs/cli/bin/nest.js', 'start', '--watch'], {
    cwd: resolve(root, 'Server'),
    stdio: 'inherit',
    windowsHide: true,
  }),
  spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev'], {
    cwd: resolve(root, 'Client'),
    stdio: 'inherit',
    windowsHide: true,
  }),
];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.pid || child.exitCode !== null) continue;
    if (process.platform === 'win32') {
      try {
        execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
          stdio: 'ignore',
          windowsHide: true,
        });
      } catch {
        /* The process may already have exited. */
      }
    } else child.kill('SIGTERM');
  }
  process.exit(code);
}
for (const child of children) {
  child.on('error', (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on('exit', (code) => {
    if (!stopping) stop(code || 0);
  });
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
