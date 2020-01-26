import { spawn } from '@beenotung/tslib/child_process';
import {
  hasDirectory,
  hasFile,
  readdir,
  readFile,
  writeFile,
} from '@beenotung/tslib/fs';
import * as path from 'path';
import * as readline from 'readline';
import { ReadLine } from 'readline';
// @ts-ignore
const mkdirp = require('async-mkdirp');
const hasbin = require('hasbin');

let io: ReadLine | undefined;

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
    '@beenotung/tslib': '^14.35.0',
    'cqrs-exp': path.join(
      process.env.HOME!,
      'workspace',
      'gitlab.com',
      'beenotung',
      'cqrs-exp',
    ),
    'gen-ts-type': '^1.3.1',
  };
  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    '@types/node': '*',
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
  const lines = [
    'node_modules',
    'package-lock.json',
    'pnpm-lock.yaml',
    'pnpm-debug.log',
    '__MACOSX/',
    'data/log/',
    'dist/',
  ];
  if (await hasFile('.gitignore')) {
    lines.push(...(await readFile('.gitignore')).toString().split('\n'));
  }
  await writeFile('.gitignore', lines.join('\n') + '\n');
}

async function initGenProject(args: {
  baseProjectName: string;
  appId: string;
  serverOrigin: {
    port: number;
    test: string;
    prod: string;
  };
}) {
  const { baseProjectName, appId, serverOrigin } = args;
  const code =
    `
import { flattenCallMetas, genProject } from 'cqrs-exp';
import { catchMain } from '@beenotung/tslib/node';
import { ArrayType } from 'gen-ts-type';
import {
  checkAppId,
  enableSubscription,
  commandTypes,
  queryTypes,
  subscribeTypes,
  alias,
  typeAlias,
  def,
  constants,
  ResultType,
  authConfig,
  authCommand,
  authQuery,
} from 'cqrs-exp/dist/helpers/gen-project-helpers';
import {
  Admin,
  AdminOnly,
  OptionalAuth,
  UserNotFound,
  NoPermission,
  Duplicated,
} from 'cqrs-exp/dist/helpers/constants';

checkAppId(${JSON.stringify(appId)});
enableSubscription();

commandTypes.push(
  { Type: 'CreateUser', In: \`{ UserId: string }\`, Out: ResultType([UserNotFound]) },
  { Type: 'CreateAdmin', In: \`{ UserId: string }\`, Out: ResultType([UserNotFound]), Admin },
);
queryTypes.push(
  { Type: 'GetUserList', In: 'void', Out: ResultType([NoPermission], \`{ Users: \${ArrayType(\`{ UserId: string }\`)} }\`) },
  { Type: 'HasUser', In: \`{ UserId: string }\`, Out: ResultType([NoPermission], \`{ HasUser: boolean }\`), Admin },
);

catchMain(genProject({
  outDirname: '.',
  baseProjectName: ${JSON.stringify(baseProjectName)},
  injectTimestampField: true,
  timestampFieldName: 'Timestamp',
  asyncLogicProcessor: true,
  staticControllerReference: true,
  injectFormat: true,
  callTypes: flattenCallMetas({
    commandTypes,
    queryTypes,
    subscribeTypes,
  }),
  // web: true,
  serverOrigin: ${JSON.stringify(serverOrigin, null, 2)},
  typeAlias,
  constants,
  // replayQuery: true,
  // storeQuery: false,
  plugins: { auth: authConfig },
}));
`.trim() + '\n';
  await writeFile(path.join('scripts', 'gen-project.ts'), code);
}

async function ask(name: string, defaultAnswer: string): Promise<string> {
  if (!io) {
    io = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }
  return new Promise<string>((resolve, reject) => {
    io!.question(`${name} [${defaultAnswer}]: `, answer => {
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
  const prodServerDomain = await ask('production server domain', 'example.com');
  const prodServerOrigin = await ask(
    'server origin',
    `https://${name}.${prodServerDomain}`,
  );
  const testServerDomain = await ask('test server domain', 'example.net');
  const testServerOrigin = await ask(
    'server origin',
    `https://${name}.${testServerDomain}`,
  );
  const port = await ask('port', '8080');
  const appId = await ask(
    'app id',
    `${name}.${prodServerDomain}`
      .split('.')
      .reverse()
      .join('.'),
  );
  console.log(`initializing gen-project for '${name}'`);
  if (name !== cwd) {
    await mkdirp(name);
    process.chdir(name);
  }
  await Promise.all([
    initPackageJson(name),
    copyTslibFile('.editorconfig'),
    copyTslibFile('.prettierrc'),
    copyTslibFile('.prettierignore'),
    initGitIgnore(),
    mkdirp('scripts'),
  ]);
  await initGenProject({
    baseProjectName: name,
    appId,
    serverOrigin: {
      port: +port,
      test: testServerOrigin,
      prod: prodServerOrigin,
    },
  });
  console.log('generated skeleton.');
}

function help() {
  console.log(
    `
cqrs-exp [command]
Commands:
  init  : initialize project skeleton, setup package.json and create scripts/gen-project.ts with default settings
  gen   : generate the client-side SDK for *-client and *-admin project, and stub code for *-server project
  help  : show this help message
`.trim(),
  );
}

function call(cmd: string) {
  if (process.platform === 'win32') {
    if (cmd.startsWith('pnpm ') || cmd.startsWith('npm ')) {
      cmd = cmd.replace('npm', 'npm.cmd');
    }
  }
  return spawn({ cmd });
}

async function gen() {
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

async function main() {
  try {
    const mode = process.argv[2];
    switch (mode) {
      case 'init':
        await initProject();
        break;
      case 'gen':
        await gen();
        break;
      case 'help':
      default:
        help();
    }
  } catch (e) {
    console.error(e);
    process.exit(0);
  } finally {
    if (io) {
      io.close();
    }
  }
}

main();
