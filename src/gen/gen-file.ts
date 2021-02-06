import { unique } from '@beenotung/tslib/array';
import { exec } from '@beenotung/tslib/child_process';
import {
  copyFile,
  exists,
  hasFile,
  readdir,
  readFile,
  writeFile as _writeFile,
} from '@beenotung/tslib/fs';
import mkdirp from 'async-mkdirp';
import * as path from 'path';
import rimraf from 'rimraf';
import * as util from 'util';
import { typeAlias } from '../helpers/gen-project-helpers';
import { CallMeta } from '../types';
import { Constants, defaultTypeName, TypeAlias } from '../utils';
import {
  genCallsCode,
  genCallTypeCode,
  genClientLibCode,
  genConnectionCode,
  genControllerCode,
  genDocumentationHtmlCode,
  genModuleCode,
  GenProjectPlugins,
  genServiceCode,
  genStatusCode,
} from './gen-code';
import { sortObjectKey } from './helpers/object';
import { addPackages, Package } from './helpers/package';
import { getModuleDirname, getSrcDirname } from './template/helpers';
import { updateRootPackageFile } from './template/package';
import { genFormatScriptFile } from './template/scripts/format';
import { genServerHelperFile } from './template/server/core/helpers';
import { updateMainFile } from './template/server/main';

async function writeFile(filename: string, code: string) {
  code = code.trim();
  code += '\n';
  await _writeFile(filename, code);
}

async function genLogicProcessorFile(args: {
  outDirname: string;
  serverProjectDirname: string;
  logicProcessorDirname: string;
  logicProcessorFilename: string;
  logicProcessorClassName: string;
  dataWrapper: { logicProcessorCode: string };
}): Promise<void> {
  const {
    serverProjectDirname,
    logicProcessorDirname,
    logicProcessorFilename,
    logicProcessorClassName,
    dataWrapper,
  } = args;
  const filename = path.join(
    getSrcDirname({ projectDirname: serverProjectDirname }),
    logicProcessorDirname,
    logicProcessorFilename,
  );
  if (await hasFile(filename)) {
    dataWrapper.logicProcessorCode = (await readFile(filename)).toString();
    return;
  }
  const code = `
export class ${logicProcessorClassName} {
}
`;
  await writeFile(filename, code);
  dataWrapper.logicProcessorCode = code;
}

async function genConnectionFile(
  args: Parameters<typeof getModuleDirname>[0] &
    Parameters<typeof genConnectionCode>[0],
): Promise<void> {
  const filename = path.join(getModuleDirname(args), 'connection.ts');
  const code = genConnectionCode(args);
  await writeFile(filename, code);
}

async function genServiceFile(
  args: {
    serviceFilename: string;
  } & Parameters<typeof genServiceCode>[0] &
    Parameters<typeof getModuleDirname>[0],
) {
  const { serviceFilename } = args;
  const code = genServiceCode(args);
  const filename = path.join(getModuleDirname(args), serviceFilename);

  await writeFile(filename, code);
}

async function genStatusFile(
  args: {
    statusFilename: string;
  } & Parameters<typeof getModuleDirname>[0] &
    Parameters<typeof genStatusCode>[0],
) {
  const { statusFilename } = args;
  const filename = path.join(getModuleDirname(args), statusFilename);
  const code = genStatusCode(args);
  await writeFile(filename, code);
}

async function genCallsFile(
  args: {
    moduleDirname: string;
    callsFilename: string;
    serverProjectDirname: string;
  } & Parameters<typeof genCallsCode>[0],
) {
  const code = genCallsCode(args);

  const { moduleDirname, callsFilename, serverProjectDirname } = args;
  const dirname = path.join(serverProjectDirname, 'src', moduleDirname);
  await mkdirp(dirname);
  const pathname = path.join(dirname, callsFilename);

  await writeFile(pathname, code);
}

async function genControllerFile(
  args: {
    controllerFilename: string;
  } & Parameters<typeof genControllerCode>[0] &
    Parameters<typeof getModuleDirname>[0],
) {
  const { controllerFilename } = args;
  const code = genControllerCode(args);
  const filename = path.join(getModuleDirname(args), controllerFilename);

  await writeFile(filename, code);
}

// up: dist/gen
// down: src
const src = path.join(__dirname, '..', '..', 'src');

async function injectServerLibFiles(args: {
  serverProjectDirname: string;
  libDirname: string;
  asyncLogicProcessor: boolean;
}) {
  const { serverProjectDirname, libDirname, asyncLogicProcessor } = args;
  const dest = path.join(serverProjectDirname, 'src', libDirname);
  await Promise.all([
    copyFile(
      path.join(src, 'log', 'log.service.ts'),
      path.join(dest, 'log.service.ts'),
    ),
    copyFile(path.join(src, 'log', 'batch.ts'), path.join(dest, 'batch.ts')),
    asyncLogicProcessor
      ? copyFile(
          path.join(src, 'utils', 'result.ts'),
          path.join(dest, 'result.ts'),
        )
      : undefined,
  ]);
}

async function genTypeFile(
  args: {
    projectDirname: string;
    typeDirname: string;
    typeFilename: string;
  } & Parameters<typeof genCallTypeCode>[0],
) {
  const code = genCallTypeCode(args);

  const { typeDirname, typeFilename, projectDirname } = args;
  const dirname = path.join(projectDirname, 'src', typeDirname);
  await mkdirp(dirname);
  const pathname = path.join(dirname, typeFilename);

  await writeFile(pathname, code);
}

async function runNestCommand(args: {
  cwd: string;
  cmd: string;
  errorMsg: string;
}) {
  const { cwd, cmd, errorMsg } = args;
  const { stdout, stderr } = await exec(cmd, { cwd });
  if (stdout.indexOf('CREATE') === -1) {
    console.error(errorMsg);
    console.error('cmd:');
    console.error(cmd);
    console.error('stdout:');
    console.error(stdout);
    console.error('stderr:');
    console.error(stderr);
    throw new Error(errorMsg);
  }
}

async function genModuleFile(
  args: {
    serverProjectDirname: string;
    moduleDirname: string;
    moduleFilename: string;
  } & Parameters<typeof genModuleCode>[0] &
    Parameters<typeof getModuleDirname>[0],
) {
  const { serverProjectDirname, moduleDirname, moduleFilename } = args;
  const code = genModuleCode(args);
  const filename = path.join(getModuleDirname(args), moduleFilename);
  if (!(await hasFile(filename))) {
    await runNestCommand({
      cwd: serverProjectDirname,
      cmd: `nest g module ${moduleDirname}`,
      errorMsg: `Failed to create nest module`,
    });
  }
  await writeFile(filename, code);
}

// only use for server
async function updateGitIgnore(args: { projectDirname: string; web: boolean }) {
  const { projectDirname, web } = args;
  const filePath = path.join(projectDirname, '.gitignore');
  let text = (await readFile(filePath)).toString();
  const lines = text.split('\n').filter(s => s !== '/.idea');

  function add(pattern: string) {
    if (new Set(lines).has(pattern)) {
      return;
    }
    lines.push(pattern);
  }

  add('data/log/');
  add('data/log_*/');
  if (web) {
    add('www/');
  }
  text = lines.join('\n');
  await writeFile(filePath, text);
}

async function genClientLibFile(
  args: {
    outDirname: string;
    clientProjectName: string;
    apiDirname: string;
    apiFilename: string;
  } & Parameters<typeof genClientLibCode>[0],
) {
  const { outDirname, clientProjectName, apiDirname, apiFilename } = args;
  const dirPath = path.join(outDirname, clientProjectName, 'src', apiDirname);
  await mkdirp(dirPath);
  const filePath = path.join(dirPath, apiFilename);
  const code = genClientLibCode(args);
  await writeFile(filePath, code);
}

const tslib_dirname = path.join(
  process.env.HOME!,
  'workspace',
  'github.com',
  'beenotung',
  'tslib',
);
let tslib_tslint: string;
let tslib_package: Package;

async function initTslib(args: { injectFormat: boolean }) {
  const { injectFormat } = args;
  if (!injectFormat) {
    return;
  }
  const tslint_file = path.join(tslib_dirname, 'tslint.json');
  if (!(await hasFile(tslint_file))) {
    const { stdout, stderr } = await exec(
      'git clone https://github.com/beenotung/tslib.git',
      {
        cwd: path.join(tslib_dirname, '..'),
      },
    );
    console.log(stdout);
    console.error(stderr);
  }
  await Promise.all([
    readFile(tslint_file).then(bin => (tslib_tslint = bin.toString())),
    readFile(path.join(tslib_dirname, 'package.json')).then(
      bin => (tslib_package = JSON.parse(bin.toString())),
    ),
  ]);
}

async function setTslint(args: {
  projectDirname: string;
  injectFormat: boolean;
}) {
  const { projectDirname, injectFormat } = args;
  const filename = path.join(projectDirname, 'tslint.json');

  let text: string;
  if (injectFormat) {
    text = tslib_tslint;
  } else {
    if (!(await hasFile(filename))) {
      return;
    }
    text = (await readFile(filename)).toString();
  }
  const json = JSON.parse(text);
  /* move the key to the first slot */
  json.rules = {
    'interface-over-type-literal': false,
    ...json.rules,
  };
  /* override existing value */
  json.rules['interface-over-type-literal'] = false;
  const newText = JSON.stringify(json, null, 2);
  await writeFile(filename, newText);
}

async function setTsconfig(args: {
  projectDirname: string;
  injectFormat: boolean;
}) {
  const { projectDirname, injectFormat } = args;
  if (!injectFormat) {
    return;
  }
  const filename = 'tsconfig.json';
  const destFile = path.join(projectDirname, filename);
  if (await hasFile(destFile)) {
    return;
  }
  await copyFile(path.join(tslib_dirname, filename), destFile);
}

function insert(o: object, key: string, values: any[]) {
  let array = (o as any)[key] || [];
  array = array.concat(values);
  array = unique(array);
  (o as any)[key] = array;
}

async function setServerTsconfig(args: {
  projectDirname: string;
  web: boolean;
}) {
  const { projectDirname, web } = args;
  for (let filename of ['tsconfig.json', 'tsconfig.build.json']) {
    filename = path.join(projectDirname, filename);
    const tsconfig = JSON.parse((await readFile(filename)).toString());

    insert(tsconfig, 'exclude', ['scripts', '**/*spec.ts', '**/*.macro.ts']);
    if (web) {
      insert(tsconfig, 'exclude', ['www']);
    }

    insert(tsconfig, 'include', ['src']);

    await writeFile(filename, JSON.stringify(tsconfig, null, 2));
  }
}

async function setServerScripts(args: { projectDirname: string }) {
  const { projectDirname } = args;
  const destDir = path.join(projectDirname, 'scripts');
  const srcDir = path.join(
    __dirname, // gen
    '..', // src
    '..', // root
    'inject-files',
    'scripts',
  );
  const [filenames] = await Promise.all([readdir(srcDir), mkdirp(destDir)]);
  await Promise.all(
    filenames.map(async filename => {
      const dest = path.join(destDir, filename);
      if (await exists(dest)) {
        return;
      }
      const src = path.join(srcDir, filename);
      await copyFile(src, dest);
    }),
  );
}

function setPackageJson(args: { injectFormat: boolean; packageJson: Package }) {
  if (!args.injectFormat) {
    return;
  }
  const pkg = args.packageJson;
  pkg.scripts = {
    ...pkg.scripts,
    format: tslib_package.scripts.format,
    postformat: tslib_package.scripts.postformat,
    ...pkg.scripts,
  };
  if (pkg.scripts.test === 'echo "Error: no test specified" && exit 1') {
    delete pkg.scripts.test;
  }
  const devDep = pkg.devDependencies || {};
  const tslib_devDep = tslib_package.devDependencies;
  Object.keys(tslib_devDep)
    .filter(name => {
      switch (name) {
        case '@types/node':
        case 'tslint':
        case 'typescript':
        case 'tslib':
        case 'prettier':
          return true;
        default:
          return name.startsWith('tslint-');
      }
    })
    .forEach(name => (devDep[name] = devDep[name] || tslib_devDep[name]));
  pkg.devDependencies = sortObjectKey(devDep);
}

async function setServerPackage(
  args: {
    baseProjectName: string;
    serverProjectDirname: string;
    ws: boolean;
    web: boolean;
    jsonSizeLimit: string | undefined;
    injectNestClient: boolean;
  } & Omit<Parameters<typeof setPackageJson>[0], 'packageJson'>,
) {
  const {
    baseProjectName,
    serverProjectDirname,
    ws,
    web,
    jsonSizeLimit,
    injectNestClient,
  } = args;
  const filename = path.join(serverProjectDirname, 'package.json');
  const bin = await readFile(filename);
  const text = bin.toString();
  const pkg: Package = JSON.parse(text);
  setPackageJson({ ...args, packageJson: pkg });
  const dep: Record<string, string> = {};
  const devDep: Record<string, string> = {};
  // for core controller and batch.ts
  dep['cli-progress'] = '^2.1.1';
  dep.nestlib = '^0.5.2';
  dep['engine.io'] = '^3.3.2';
  dep['engine.io-client'] = '^3.3.2';
  // for log.service.ts
  dep['graceful-fs'] = '^4.1.15';
  devDep['@types/graceful-fs'] = '^4.1.3';
  dep['mkdirp-sync'] = '^0.0.3';
  // for generator in batch.ts
  devDep.typescript = '^3.7.2';

  // for quick compilation
  devDep.ctsc = '^1.1.0';
  const build = 'ctsc';
  if (pkg.scripts.build && pkg.scripts.build !== build) {
    let backup = pkg.scripts.build;
    if (pkg.scripts.prebuild) {
      backup = 'npm run prebuild && ' + backup;
    }
    pkg.scripts['build:nest'] = backup;
  }
  pkg.scripts.build = build;
  pkg.scripts.pm2 = `pm2 restart ${baseProjectName} || pm2 start --name ${baseProjectName} dist/main.js`;
  pkg.scripts.preserve = 'npm run build';
  pkg.scripts.serve = 'npm run pm2';

  if (injectNestClient) {
    dep['nest-client'] = '^0.6.1';
  }
  if (ws) {
    dep['typestub-primus'] = '^1.3.2';
    dep['primus-emitter'] = '^3.1.1';
  }
  if (web || jsonSizeLimit) {
    dep.express = '^4.17.1';
    devDep['@types/express'] = '^4.17.1';
    if (web) {
      devDep['@types/serve-static'] = '^1.13.3';
    }
  }
  devDep['@types/express-serve-static-core'] = '^4.16.7';
  devDep['@types/cli-progress'] = '^1.8.1';
  addPackages(pkg, 'dependencies', dep);
  addPackages(pkg, 'devDependencies', devDep);
  const newText = JSON.stringify(pkg, null, 2);
  await writeFile(filename, newText);
}

async function setClientPackage(
  args: {
    projectDirname: string;
    ws: boolean;
  } & Omit<Parameters<typeof setPackageJson>[0], 'packageJson'>,
) {
  const { projectDirname, ws } = args;
  const filename = path.join(projectDirname, 'package.json');
  if (!(await hasFile(filename))) {
    await exec('npm init --yes', { cwd: projectDirname });
  }
  const bin = await readFile(filename);
  const text = bin.toString();
  const pkg: Package = JSON.parse(text);
  setPackageJson({ ...args, packageJson: pkg });
  const dep: Record<string, string> = {};
  const devDep: Record<string, string> = {};
  dep['nest-client'] = '^0.6.1';
  if (ws) {
    dep['typestub-primus'] = '^1.3.2';
  }
  addPackages(pkg, 'dependencies', dep);
  addPackages(pkg, 'devDependencies', devDep);
  const newText = JSON.stringify(pkg, null, 2);
  await writeFile(filename, newText);
}

function genIdeaModuleIml(args: {
  srcDirs?: string[];
  testDirs?: string[];
  excludeDirs?: string[];
}) {
  const srcDirs = args.srcDirs || [];
  const testDirs = args.testDirs || [];
  const excludeDirs = args.excludeDirs || [];
  return `
<?xml version="1.0" encoding="UTF-8"?>
<module type="JAVA_MODULE" version="4">
  <component name="NewModuleRootManager" inherit-compiler-output="true">
    <exclude-output />
    <content url="file://$MODULE_DIR$">
      ${srcDirs
        .sort()
        .map(
          dir =>
            `<sourceFolder url="file://$MODULE_DIR$/${dir}" isTestSource="false" />`,
        )
        .join('\n      ')}
      ${testDirs
        .sort()
        .map(
          dir =>
            `<sourceFolder url="file://$MODULE_DIR$/${dir}" isTestSource="true" />`,
        )
        .join('\n      ')}
      ${excludeDirs
        .sort()
        .map(dir => `<excludeFolder url="file://$MODULE_DIR$/${dir}" />`)
        .join('\n      ')}
    </content>
    <orderEntry type="inheritedJdk" />
    <orderEntry type="sourceFolder" forTests="false" />
  </component>
</module>
`
    .split('\n')
    .filter(s => s.trim())
    .join('\n');
}

function genIdeaModulesXml(projectName: string) {
  return `
<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="ProjectModuleManager">
    <modules>
      <module fileurl="file://$PROJECT_DIR$/.idea/${projectName}.iml" filepath="$PROJECT_DIR$/.idea/${projectName}.iml" />
    </modules>
  </component>
</project>
`.trim();
}

async function setBaseProjectIdeaConfig(args: {
  outDirname: string;
  baseProjectName: string;
  serverProjectName: string;
  clientProjectName: string;
  adminProjectName: string;
}) {
  const {
    outDirname,
    baseProjectName,
    serverProjectName,
    clientProjectName,
    adminProjectName,
  } = args;
  const appProjectName = clientProjectName.replace('-client', '-app');
  const ideaDir = path.join(outDirname, '.idea');
  await mkdirp(ideaDir);
  await Promise.all([
    writeFile(
      path.join(ideaDir, baseProjectName + '.iml'),
      genIdeaModuleIml({
        excludeDirs: [
          serverProjectName,
          clientProjectName,
          adminProjectName,
          appProjectName,
        ],
      }),
    ),
    writeFile(
      path.join(ideaDir, 'modules.xml'),
      genIdeaModulesXml(baseProjectName),
    ),
  ]);
}

async function setProjectIdeaConfig(args: {
  projectDirname: string;
  projectName: string;
}) {
  const { projectDirname, projectName } = args;
  await Promise.all([
    writeFile(
      path.join(projectDirname, '.idea', projectName + '.iml'),
      genIdeaModuleIml({
        srcDirs: ['src'],
        testDirs: ['test'],
        excludeDirs: ['dist', 'data', 'www'],
      }),
    ),
    writeFile(
      path.join(projectDirname, '.idea', 'modules.xml'),
      genIdeaModulesXml(projectName),
    ),
  ]);
}

async function setEditorConfig(args: {
  projectDirname: string;
  injectFormat: boolean;
}) {
  const { projectDirname, injectFormat } = args;
  if (!injectFormat) {
    return;
  }
  const filename = '.editorconfig';
  await copyFile(
    path.join(tslib_dirname, filename),
    path.join(projectDirname, filename),
  );
}

async function setPrettierrc(args: {
  projectDirname: string;
  injectFormat: boolean;
}) {
  const { projectDirname, injectFormat } = args;
  if (!injectFormat) {
    return;
  }
  const filename = '.prettierrc';
  await copyFile(
    path.join(tslib_dirname, filename),
    path.join(projectDirname, filename),
  );
}

function hasNestProject(args: {
  serverProjectDirname: string;
}): Promise<boolean> {
  const { serverProjectDirname } = args;
  const filename = path.join(serverProjectDirname, 'nest-cli.json');
  return hasFile(filename);
}

export function injectTimestampFieldOnCall<Call extends { In: string }>(args: {
  call: Call;
  timestampFieldName: string;
  injectTimestampField: boolean;
}): Call {
  const { call, timestampFieldName, injectTimestampField } = args;
  let { In } = call;
  if (!injectTimestampField) {
    return call;
  }
  In = In.trim();
  if (In === '{}' || In === 'void' || In === 'null' || In === 'undefined') {
    In = `{ ${timestampFieldName}: number }`;
  } else if (
    In.startsWith('{') &&
    In.endsWith('}') &&
    In.split('{').length === 2 &&
    In.split('}').length === 2
  ) {
    let head = In.substring(0, In.length - 1).trimRight();
    if (!head.endsWith(',')) {
      head += ',';
    }
    if (In.includes('\n')) {
      // has newline
      In =
        head +
        `
  ${timestampFieldName}: number,
}`;
    } else {
      // no newline
      In = head + ` ${timestampFieldName}: number }`;
    }
  } else {
    In = `(${In}) & { ${timestampFieldName}: number }`;
  }
  return {
    ...call,
    In,
  };
}

function splitCallTypes(
  callTypes: CallMeta[],
): {
  clientCallTypes: CallMeta[];
  adminCallTypes: CallMeta[];
  internalCallTypes: CallMeta[];
} {
  const clientCallTypes: CallMeta[] = [];
  const adminCallTypes: CallMeta[] = [];
  const internalCallTypes: CallMeta[] = [];
  callTypes.forEach(call => {
    if (call.Internal) {
      internalCallTypes.push(call);
    } else if (call.Admin) {
      adminCallTypes.push(call);
    } else {
      clientCallTypes.push(call);
    }
  });
  return { clientCallTypes, adminCallTypes, internalCallTypes };
}

async function genDocumentationHtmlFile(
  args: {
    outDirname: string;
    docDirname: string;
    clientDocFilename: string;
    adminDocFilename: string;
    internalDocFilename: string;
    clientCallTypes: CallMeta[];
    adminCallTypes: CallMeta[];
    internalCallTypes: CallMeta[];
  } & Omit<
    Parameters<typeof genDocumentationHtmlCode>[0],
    'role' | 'callTypes'
  >,
) {
  const {
    outDirname,
    docDirname,
    clientDocFilename,
    adminDocFilename,
    internalDocFilename,
    clientCallTypes,
    adminCallTypes,
    internalCallTypes,
  } = args;
  const dirname = path.join(outDirname, docDirname);
  await mkdirp(dirname);

  function genDocument({
    docFilename,
    role,
    callTypes,
  }: {
    docFilename: string;
    role: string;
    callTypes: CallMeta[];
  }) {
    const filename = path.join(dirname, docFilename);
    const code = genDocumentationHtmlCode({
      ...args,
      role,
      callTypes,
    });
    return writeFile(filename, code);
  }

  await Promise.all([
    genDocument({
      role: 'Client',
      docFilename: clientDocFilename,
      callTypes: clientCallTypes,
    }),
    genDocument({
      role: 'Admin',
      docFilename: adminDocFilename,
      callTypes: adminCallTypes,
    }),
    genDocument({
      role: 'Internal',
      docFilename: internalDocFilename,
      callTypes: internalCallTypes,
    }),
  ]);
}

function forceOptionalField(type: string) {
  return type.replace(/\?:/g, ': undefined |');
}

export const defaultGenProjectArgs = {
  outDirname: 'out',
  docDirname: '',
  typeDirname: 'domain',
  typeFilename: 'types.ts',
  callsFilename: 'calls.ts',
  callTypeName: 'Call',
  queryTypeName: defaultTypeName.queryTypeName,
  commandTypeName: defaultTypeName.commandTypeName,
  subscribeTypeName: defaultTypeName.subscribeTypeName,
  entryModule: 'app',
  moduleDirname: 'core',
  moduleFilename: 'core.module.ts',
  moduleClassName: 'CoreModule',
  serviceFilename: 'core.service.ts',
  serviceClassName: 'CoreService',
  controllerFilename: 'core.controller.ts',
  controllerClassName: 'CoreController',
  serverHelperFilename: 'helpers.ts',
  staticControllerReference: false,
  statusFilename: 'status.ts',
  statusName: 'status',
  serviceApiPath: 'core',
  callApiPath: 'Call',
  logicProcessorDirname: 'domain',
  apiDirname: 'domain',
  apiFilename: 'api.ts',
  logicProcessorFilename: 'logic-processor.ts',
  logicProcessorClassName: 'LogicProcessor',
  libDirname: 'lib',
  timestampFieldName: 'Timestamp',
  injectTimestampField: true,
  primusGlobalName: 'Primus',
  primusPath: '/primus',
  ws: true,
  web: false,
  jsonSizeLimit: undefined,
  injectFormat: true,
  asyncLogicProcessor: false,
  replayCommand: true,
  replayQuery: false,
  storeCommand: true,
  storeQuery: true,
  typeAlias: {},
  constants: {} as Constants,
  plugins: {} as GenProjectPlugins,
  forceOptionalToUndefined: false,
};
export type GenProjectOptions = {
  outDirname?: string;
  docDirname?: string;
  clientDocFilename?: string;
  adminDocFilename?: string;
  internalDocFilename?: string;
  baseProjectName: string;
  serverProjectName?: string;
  clientProjectName?: string;
  adminProjectName?: string;
  typeDirname?: string;
  typeFilename?: string;
  callsFilename?: string;
  callTypes: CallMeta[];
  callTypeName?: string;
  commandTypeName?: string;
  queryTypeName?: string;
  subscribeTypeName?: string;
  entryModule?: string;
  moduleDirname?: string;
  serviceFilename?: string;
  serviceClassName?: string;
  controllerFilename?: string;
  controllerClassName?: string;
  serverHelperFilename?: string;
  staticControllerReference?: boolean;
  statusFilename?: string;
  statusName?: string;
  serviceAPIPath?: string;
  callApiPath?: string;
  logicProcessorDirname?: string;
  logicProcessorFilename?: string;
  logicProcessorClassName?: string;
  libDirname?: string;
  apiDirname?: string;
  apiFilename?: string;
  timestampFieldName?: string;
  injectTimestampField?: boolean;
  primusGlobalName?: string;
  primusPath?: string;
  ws?: boolean;
  web?: boolean;
  jsonSizeLimit?: string;
  serverOrigin: {
    port: number;
    test: string;
    prod: string;
  };
  injectFormat?: boolean;
  asyncLogicProcessor?: boolean;
  replayCommand?: boolean;
  replayQuery?: boolean;
  storeCommand?: boolean;
  storeQuery?: boolean;
  typeAlias?: TypeAlias;
  constants?: Constants;
  plugins?: GenProjectPlugins;
  forceOptionalToUndefined?: boolean;
};

export async function genProject(_args: GenProjectOptions) {
  const __args = {
    ...defaultGenProjectArgs,
    ..._args,
    serverProjectName:
      _args.serverProjectName || _args.baseProjectName + '-server',
    clientProjectName:
      _args.clientProjectName || _args.baseProjectName + '-client',
    adminProjectName:
      _args.adminProjectName || _args.baseProjectName + '-admin',
    clientDocFilename:
      _args.clientDocFilename || _args.baseProjectName + '-client-doc.html',
    adminDocFilename:
      _args.adminDocFilename || _args.baseProjectName + '-admin-doc.html',
    internalDocFilename:
      _args.internalDocFilename || _args.baseProjectName + '-internal-doc.html',
  };
  const {
    outDirname,
    serverProjectName,
    clientProjectName,
    adminProjectName,
    typeDirname,
    logicProcessorDirname,
    libDirname,
    injectTimestampField,
    timestampFieldName,
    callTypes,
    serverOrigin,
    plugins,
    forceOptionalToUndefined,
  } = __args;
  const { port } = serverOrigin;
  if (forceOptionalToUndefined) {
    callTypes.forEach(call => {
      call.In = forceOptionalField(call.In);
      call.Out = forceOptionalField(call.Out);
    });
    Object.entries(typeAlias).forEach(([name, type]) => {
      typeAlias[name] = forceOptionalField(type);
    });
  }
  await mkdirp(outDirname);
  const serverProjectDirname = path.join(outDirname, serverProjectName);
  const clientProjectDirname = path.join(outDirname, clientProjectName);
  const adminProjectDirname = path.join(outDirname, adminProjectName);
  const args = {
    ...__args,
    serverProjectDirname,
  };
  const { clientCallTypes, adminCallTypes, internalCallTypes } = splitCallTypes(
    callTypes,
  );

  callTypes.forEach(call => {
    if (
      (args.replayCommand &&
        call.CallType === args.commandTypeName &&
        typeof call.Replay !== 'boolean') ||
      (args.replayQuery &&
        call.CallType === args.queryTypeName &&
        typeof call.Replay !== 'boolean')
    ) {
      call.Replay = true;
    }
  });

  if (!(await hasNestProject(args))) {
    await runNestCommand({
      cwd: outDirname,
      cmd: `nest new --skip-install ${serverProjectName}`,
      errorMsg: `Failed to create nest project`,
    });
    const serverGitDir = path.join(args.serverProjectDirname, '.git');
    await util.promisify(rimraf)(serverGitDir);
  }
  const serverSrcDirname = getSrcDirname({
    projectDirname: serverProjectDirname,
  });
  await Promise.all([
    mkdirp(path.join(outDirname, 'scripts')),
    mkdirp(path.join(serverProjectDirname, '.idea')),
    mkdirp(path.join(clientProjectDirname, '.idea')),
    mkdirp(path.join(adminProjectDirname, '.idea')),
    mkdirp(path.join(serverSrcDirname, typeDirname)),
    mkdirp(path.join(serverSrcDirname, logicProcessorDirname)),
    mkdirp(path.join(serverSrcDirname, libDirname)),
  ]);
  const dataWrapper: { logicProcessorCode: string } = {} as any;
  await Promise.all([
    updateRootPackageFile(args),
    genFormatScriptFile(args),
    genDocumentationHtmlFile({
      ...args,
      clientCallTypes,
      adminCallTypes,
      internalCallTypes,
    }),
    genLogicProcessorFile({
      ...args,
      dataWrapper,
    }),
    initTslib(args),
    setProjectIdeaConfig({
      projectDirname: serverProjectDirname,
      projectName: serverProjectName,
    }),
    setProjectIdeaConfig({
      projectDirname: clientProjectDirname,
      projectName: clientProjectName,
    }),
    setProjectIdeaConfig({
      projectDirname: adminProjectDirname,
      projectName: adminProjectName,
    }),
    setBaseProjectIdeaConfig({
      ...args,
    }),
    updateMainFile({ ...args, projectDirname: serverProjectDirname, port }),
    updateGitIgnore({ ...args, projectDirname: serverProjectDirname }),
    genTypeFile({
      ...args,
      projectDirname: serverProjectDirname,
      callTypes: callTypes.map(call =>
        injectTimestampFieldOnCall({
          call,
          injectTimestampField,
          timestampFieldName,
        }),
      ),
    }),
    genTypeFile({
      ...args,
      projectDirname: clientProjectDirname,
      callTypes: clientCallTypes,
    }),
    genTypeFile({
      ...args,
      projectDirname: adminProjectDirname,
      callTypes: adminCallTypes,
    }),
    genClientLibFile({
      ...args,
      clientProjectName,
      callTypes: clientCallTypes,
    }),
    genClientLibFile({
      ...args,
      clientProjectName: adminProjectName,
      callTypes: adminCallTypes,
    }),
  ]);
  await genModuleFile(args);
  await Promise.all([
    genConnectionFile(args),
    genServiceFile({
      ...args,
      logicProcessorCode: dataWrapper.logicProcessorCode,
    }),
    genServerHelperFile(args),
    genStatusFile(args),
    genCallsFile(args),
    genControllerFile(args),
    injectServerLibFiles(args),
  ]);
  await Promise.all([
    setServerPackage({ ...args, injectNestClient: !!plugins?.auth }),
    setClientPackage({ ...args, projectDirname: clientProjectDirname }),
    setClientPackage({ ...args, projectDirname: adminProjectDirname }),
    ...(([] as Array<Promise<void>>).concat.apply(
      [],
      [
        serverProjectDirname,
        clientProjectDirname,
        adminProjectDirname,
      ].map(projectDirname => [
        setTslint({ ...args, projectDirname }),
        setTsconfig({ ...args, projectDirname }),
        setEditorConfig({ ...args, projectDirname }),
        setPrettierrc({ ...args, projectDirname }),
      ]),
    ) as Array<Promise<any>>),
  ]);
  await Promise.all([
    setServerTsconfig({ ...args, projectDirname: serverProjectDirname }),
    setServerScripts({ ...args, projectDirname: serverProjectDirname }),
  ]);
}
