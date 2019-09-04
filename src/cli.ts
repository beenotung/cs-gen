#!/usr/bin/env node
import { hasFile, readFile, writeFile } from '@beenotung/tslib/fs';
import { catchMain } from '@beenotung/tslib/node';
import * as path from 'path';
import * as readline from 'readline';
// @ts-ignore
const mkdirp = require('async-mkdirp');

const io = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function initPackageJson(name: string) {
  let packageJson: any = {};
  if (await hasFile('package.json')) {
    packageJson = JSON.parse((await readFile('package.json')).toString());
  }
  packageJson.name = packageJson.name || name;
  packageJson.scripts = {
    ...packageJson.scripts,
    gen: 'ts-node scripts/gen-project',
  };
  packageJson.dependencies = {
    ...packageJson.dependencies,
    '@beenotung/tslib': '^14.34.1',
    'cqrs-exp': path.join(
      process.env.HOME!,
      'workspace',
      'gitlab.com',
      'beenotung',
      'cqrs-exp',
    ),
  };
  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    '@types/node': '*',
    'gen-ts-type': '^1.3.1',
    'ts-node': '^8.3.0',
    typescript: '^3.5.2',
  };
  await writeFile('package.json', JSON.stringify(packageJson, null, 2));
}

const tslibDir = path.join(
  process.env.HOME!,
  'workspace',
  'github.com',
  'beenotung',
  'tslib',
);

async function copyTslibFile(filename: string) {
  if (!(await hasFile(filename))) {
    await writeFile(filename, await readFile(path.join(tslibDir, filename)));
  }
}

async function initGitIgnore() {
  const lines = ['node_modules', 'pnpm-lock.yaml', 'pnpm-debug.log'];
  if (await hasFile('.gitignore')) {
    lines.push(...(await readFile('.gitignore')).toString().split('\n'));
  }
  await writeFile('.gitignore', lines.join('\n') + '\n');
}

async function initGenProject(args: {
  baseProjectName: string;
  appId: string;
  serverOrigin: string;
}) {
  const { baseProjectName, appId, serverOrigin } = args;
  const code =
    `
import { flattenCallMetas, genProject } from 'cqrs-exp';
import { catchMain } from '@beenotung/tslib/node';
import {
  checkAppId,
  commandTypes,
  queryTypes,
  subscribeTypes,
  typeAlias,
} from 'cqrs-exp/dist/helpers/gen-project-helpers';

checkAppId(${JSON.stringify(appId)});

catchMain(genProject({
  outDirname: '.',
  baseProjectName: ${JSON.stringify(baseProjectName)},
  injectTimestampField: true,
  timestampFieldName: 'Timestamp',
  asyncLogicProcessor: true,
  staticControllerReference: true,
  callTypes: flattenCallMetas({
    commandTypes,
    queryTypes,
    subscribeTypes,
  }),
  serverOrigin: ${JSON.stringify(serverOrigin)},
  typeAlias,
}));
`.trim() + '\n';
  await writeFile(path.join('scripts', 'gen-project.ts'), code);
}

async function ask(name: string, defaultAnswer: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    io.question(`${name} [${defaultAnswer}]: `, answer => {
      if (answer) {
        resolve(answer);
      } else {
        resolve(defaultAnswer);
      }
    });
  });
}

async function initProject() {
  const cwd = path.basename(process.cwd());
  const name = await ask('project name', cwd);
  const serverDomain = await ask('server domain', 'example.com');
  const appId = await ask('app id', `${name}.${serverDomain}`);
  const serverOrigin = await ask(
    'server origin',
    `https://${name}.${serverDomain}`,
  );
  io.close();
  console.log(`initializing gen-project for '${name}'`);
  if (name !== cwd) {
    await mkdirp(name);
    process.chdir(name);
  }
  await Promise.all([
    initPackageJson(name),
    copyTslibFile('.editorconfig'),
    copyTslibFile('.prettierrc'),
    initGitIgnore(),
    mkdirp('scripts'),
  ]);
  await initGenProject({
    baseProjectName: name,
    appId,
    serverOrigin,
  });
  console.log('generated skeleton.');
}

catchMain(initProject());
