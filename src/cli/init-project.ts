import { hasFile, readFile, writeFile } from '@beenotung/tslib/fs';
import * as path from 'path';
import { objectToQuoteString } from '../gen/helpers/quote-string';
import { CancelSubscribe } from '../helpers/gen-project-helpers';
import { getIO } from './helpers';
// @ts-ignore
const mkdirp = require('async-mkdirp');
async function ask(name: string, defaultAnswer: string): Promise<string> {
  const io = getIO();
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
    '.DS_Store',
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
  Internal,
  OptionalAuth,
  UserNotFound,
  NoPermission,
  Duplicated,
} from 'cqrs-exp/dist/helpers/constants';

const app_id = ${JSON.stringify(appId)};
def({ app_id });

authConfig.AppId = app_id;
// authConfig.ExposeAttemptPrefix = true; // for legacy API

if ('enableSubscription') {
  commandTypes.push(${objectToQuoteString(CancelSubscribe)});
}

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
  // replayCommand: false,
  // replayQuery: true,
  // storeQuery: false,
  plugins: { auth: authConfig },
}));
`.trim() + '\n';
  await writeFile(path.join('scripts', 'gen-project.ts'), code);
}

export async function initProject() {
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
