import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error('Usage: node tools/run-with-dev-env.mjs <command> [...args]');
  process.exit(1);
}

const workspaceDataDirectory =
  process.env.NX_WORKSPACE_DATA_DIRECTORY ??
  path.join(os.tmpdir(), 'templateforge-nx-workspace-data');

mkdirSync(workspaceDataDirectory, { recursive: true });

const executable = process.platform === 'win32' ? 'cmd.exe' : command;
const spawnArgs =
  process.platform === 'win32'
    ? ['/d', '/s', '/c', [command, ...args].map(quoteWindowsArg).join(' ')]
    : args;

const child = spawn(executable, spawnArgs, {
  env: {
    ...process.env,
    NX_WORKSPACE_DATA_DIRECTORY: workspaceDataDirectory,
  },
  stdio: 'inherit',
});

function quoteWindowsArg(value) {
  if (!/[ \t&()^|<>"]/.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '\\"')}"`;
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    child.kill(signal);
  });
}

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
