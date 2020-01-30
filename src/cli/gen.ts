import { spawn } from '@beenotung/tslib/child_process';
import { hasDirectory, hasFile, readdir, readFile } from '@beenotung/tslib/fs';
import * as path from 'path';
const hasbin = require('hasbin');
function call(cmd: string) {
  if (process.platform === 'win32') {
    if (cmd.startsWith('pnpm ') || cmd.startsWith('npm ')) {
      cmd = cmd.replace('npm', 'npm.cmd');
    }
  }
  return spawn({ cmd });
}

export async function gen() {
  let name: string | undefined;
  if (await hasFile('package.json')) {
    name = JSON.parse((await readFile('package.json')).toString()).name;
  }
  if (!name) {
    const files = await readdir('.');
    files: for (const file of files) {
      for (const part of ['client', 'admin', 'server']) {
        if (file.endsWith('-' + part)) {
          name = file.replace('-' + part, '');
          break files;
        }
      }
    }
  }
  if (!name) {
    console.error('project name not detected');
    process.exit(1);
  }
  if (!hasbin.sync('pnpm')) {
    await call('npm i -g pnpm');
  }
  await call('npm run gen');
  process.chdir('scripts');
  for (const part of ['server', 'client', 'admin']) {
    process.chdir(path.join('..', `${name}-${part}`));
    if (!(await hasDirectory('node_modules'))) {
      await call('pnpm i');
    }
    await call('npm run format');
  }
}
