import { unique } from '@beenotung/tslib/array';
import { exec } from '@beenotung/tslib/child_process';
import {
  copyFile,
  hasFile,
  readFile,
  writeFile as _writeFile,
} from '@beenotung/tslib/fs';
import mkdirp from 'async-mkdirp';
import * as path from 'path';
import { CallMeta } from '../types';
import { Constants, defaultTypeName, TypeAlias } from '../utils';
import {
  genCallsCode,
  genCallTypeCode,
  genClientLibCode,
  genConnectionCode,
  genControllerCode,
  genDeduplicateSnapshotCode,
  genDocumentationHtmlCode,
  genMainCode,
  genModuleCode,
  GenProjectPlugins,
  genServiceCode,
  genSnapshotCallCode,
  genStatusCode,
} from './gen-code';

async function writeFile(filename: string, code: string) {
  code = code.trim();
  code += '\n';
  await _writeFile(filename, code);
}

async function writeBinFile(filename: string, code: string) {
  code = code.trim();
  code += '\n';
  await _writeFile(filename, code);
  await exec('chmod +x ' + JSON.stringify(filename));
}

function getSrcDirname(args: { projectDirname: string }): string {
  const { projectDirname } = args;
  return path.join(projectDirname, 'src');
}

function getModuleDirname(args: {
  outDirname: string;
  serverProjectDirname: string;
  moduleDirname: string;
}): string {
  const { moduleDirname, serverProjectDirname } = args;
  return path.join(
    getSrcDirname({ projectDirname: serverProjectDirname }),
    moduleDirname,
  );
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

async function genConnectionFile(args: {
  outDirname: string;
  serverProjectDirname: string;
  moduleDirname: string;
  typeDirname: string;
  typeFilename: string;
  statusFilename: string;
  statusName: string;
}): Promise<void> {
  const filename = path.join(getModuleDirname(args), 'connection.ts');
  const code = genConnectionCode(args);
  await writeFile(filename, code);
}

async function genServiceFile(args: {
  outDirname: string;
  serverProjectDirname: string;
  moduleDirname: string;
  serviceFilename: string;
  serviceClassName: string;
  typeDirname: string;
  typeFilename: string;
  callTypes: CallMeta[];
  callTypeName: string;
  subscribeTypeName: string;
  logicProcessorDirname: string;
  logicProcessorFilename: string;
  logicProcessorClassName: string;
  logicProcessorCode: string;
  asyncLogicProcessor: boolean;
  libDirname: string;
  plugins: GenProjectPlugins;
}) {
  const { serviceFilename } = args;
  const code = genServiceCode(args);
  const filename = path.join(getModuleDirname(args), serviceFilename);

  await writeFile(filename, code);
}

async function genStatusFile(args: {
  statusFilename: string;
  statusName: string;
  outDirname: string;
  serverProjectDirname: string;
  moduleDirname: string;
}) {
  const { statusFilename } = args;
  const filename = path.join(getModuleDirname(args), statusFilename);
  const code = genStatusCode(args);
  await writeFile(filename, code);
}

async function genCallsFile(args: {
  outDirname: string;
  serverProjectDirname: string;
  moduleDirname: string;
  typeDirname: string;
  typeFilename: string;
  callTypeName: string;
  callsFilename: string;
  callTypes: CallMeta[];
}) {
  const code = genCallsCode(args);

  const { moduleDirname, callsFilename, serverProjectDirname } = args;
  const dirname = path.join(serverProjectDirname, 'src', moduleDirname);
  await mkdirp(dirname);
  const pathname = path.join(dirname, callsFilename);

  await writeFile(pathname, code);
}

async function genControllerFile(args: {
  outDirname: string;
  serverProjectDirname: string;
  moduleDirname: string;
  typeDirname: string;
  typeFilename: string;
  callsFilename: string;
  callTypeName: string;
  commandTypeName: string;
  queryTypeName: string;
  serviceClassName: string;
  serviceFilename: string;
  controllerClassName: string;
  libDirname: string;
  staticControllerReference: boolean;
  serviceApiPath: string;
  callApiPath: string;
  controllerFilename: string;
  statusFilename: string;
  statusName: string;
  ws: boolean;
  asyncLogicProcessor: boolean;
  replayQuery: boolean;
  storeQuery: boolean;
  timestampFieldName: string;
  injectTimestampField: boolean;
}) {
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
    copyFile(
      path.join(src, 'log', 'snapshot.ts'),
      path.join(dest, 'snapshot.ts'),
    ),
    readFile(path.join(src, 'utils.ts')).then(bin => {
      const blocks = bin
        .toString()
        .replace(/\r/g, '')
        .split('\n\n');
      const ps: Array<Promise<any>> = [];
      // ps.push(
      //   writeFile(
      //     path.join(dest, 'call.type.ts'),
      //     blocks.filter(s => s.includes('interface CallInput')).join('\n\n'),
      //   ),
      // );
      if (asyncLogicProcessor) {
        ps.push(
          writeFile(
            path.join(dest, 'result.ts'),
            'export type Result<T> = T | Promise<T>;' +
              '\n\n' +
              blocks
                .filter(
                  block =>
                    block.includes('function isPromise') ||
                    block.includes('function then'),
                )
                .join('\n\n'),
          ),
        );
      }
      return Promise.all(ps);
    }),
  ]);
}

async function genTypeFile(args: {
  projectDirname: string;
  typeDirname: string;
  typeFilename: string;
  callTypes: CallMeta[];
  callTypeName: string;
  queryTypeName: string;
  commandTypeName: string;
  subscribeTypeName: string;
  typeAlias: TypeAlias;
  constants: Constants;
}) {
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

async function genModuleFile(args: {
  outDirname: string;
  serverProjectDirname: string;
  moduleDirname: string;
  moduleFilename: string;
  moduleClassName: string;
  serviceFilename: string;
  serviceClassName: string;
  controllerFilename: string;
  controllerClassName: string;
  libDirname: string;
}) {
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

async function updateMainFile(args: {
  projectDirname: string;
  entryModule: string;
  primusGlobalName: string;
  primusPath: string;
  ws: boolean;
  port: number;
  web: boolean;
}) {
  const srcPath = getSrcDirname(args);
  const mainPath = path.join(srcPath, 'main.ts');
  const originalCode = (await readFile(mainPath)).toString();
  const newMainCode = genMainCode({
    ...args,
  });
  if (originalCode.trim() !== newMainCode.trim()) {
    await writeFile(mainPath, newMainCode);
  }
}

// only use for server
async function updateGitIgnore(args: { projectDirname: string }) {
  const { projectDirname } = args;
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
  text = lines.join('\n');
  await writeFile(filePath, text);
}

async function genClientLibFile(args: {
  outDirname: string;
  typeDirname: string;
  typeFilename: string;
  apiDirname: string;
  apiFilename: string;
  serverProjectName: string;
  clientProjectName: string;
  serviceApiPath: string;
  serviceClassName: string;
  callApiPath: string;
  callTypeName: string;
  subscribeTypeName: string;
  callTypes: CallMeta[];
  primusGlobalName: string;
  primusPath: string;
  ws: boolean;
  serverOrigin: {
    port: number;
    test: string;
    prod: string;
  };
}) {
  const { outDirname, clientProjectName, apiDirname, apiFilename } = args;
  const dirPath = path.join(outDirname, clientProjectName, 'src', apiDirname);
  await mkdirp(dirPath);
  const filePath = path.join(dirPath, apiFilename);
  const code = genClientLibCode(args);
  await writeFile(filePath, code);
}

interface Package {
  scripts: { [name: string]: string };
  devDependencies: { [name: string]: string };
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

async function setServerTsconfig(args: { projectDirname: string }) {
  const { projectDirname } = args;
  for (let filename of ['tsconfig.json', 'tsconfig.build.json']) {
    filename = path.join(projectDirname, filename);
    const tsconfig = JSON.parse((await readFile(filename)).toString());
    tsconfig.exclude = tsconfig.exclude || [];
    tsconfig.exclude.push('scripts');
    tsconfig.exclude = unique(tsconfig.exclude);
    await writeFile(filename, JSON.stringify(tsconfig, null, 2));
  }
}

async function setServerScripts(args: {
  projectDirname: string;
  libDirname: string;
  omits: Array<'snapshot'>;
}) {
  const { projectDirname, omits } = args;
  const dirname = path.join(projectDirname, 'scripts');
  await mkdirp(dirname);
  const ps: Array<Promise<any>> = [];
  if (!omits.includes('snapshot')) {
    ps.push(
      writeBinFile(
        path.join(dirname, 'snapshot-calls.ts'),
        genSnapshotCallCode(args),
      ),
      writeBinFile(
        path.join(dirname, 'deduplicate-snapshots.ts'),
        genDeduplicateSnapshotCode(args),
      ),
    );
  }
  await Promise.all(ps);
}

const dependencies: 'dependencies' = 'dependencies';
const devDependencies: 'devDependencies' = 'devDependencies';

function sortObjectKey<T extends object>(json: T): T {
  const res = {} as T;
  Object.keys(json)
    .sort()
    .forEach(x => ((res as any)[x] = (json as any)[x]));
  return res;
}

function setPackageJson(args: { injectFormat: boolean; packageJson: Package }) {
  if (!args.injectFormat) {
    return;
  }
  const json = args.packageJson;
  json.scripts = {
    ...json.scripts,
    format: tslib_package.scripts.format,
    postformat: tslib_package.scripts.postformat,
  };
  if (json.scripts.test === 'echo "Error: no test specified" && exit 1') {
    delete json.scripts.test;
  }
  const devDep = json[devDependencies] || {};
  json[devDependencies] = devDep;
  const tslib_devDep = tslib_package[devDependencies];
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
}

async function setServerPackage(args: {
  serverProjectDirname: string;
  ws: boolean;
  web: boolean;
  injectFormat: boolean;
  injectNestClient: boolean;
}) {
  const { serverProjectDirname, ws, web, injectNestClient } = args;
  const filename = path.join(serverProjectDirname, 'package.json');
  const bin = await readFile(filename);
  const text = bin.toString();
  const json = JSON.parse(text);
  setPackageJson({ ...args, packageJson: json });
  const dep = json[dependencies] || {};
  const devDep = json[devDependencies] || {};
  // for core controller and snapshot.ts
  dep['cli-progress'] = '^2.1.1';
  dep.nestlib = '^0.3.1';
  dep['engine.io'] = '^3.3.2';
  dep['engine.io-client'] = '^3.3.2';
  // for log.service.ts
  dep['graceful-fs'] = '^4.1.15';
  devDep['@types/graceful-fs'] = '^4.1.3';
  dep['mkdirp-sync'] = '^0.0.3';
  // for generator in snapshot.ts
  devDep.typescript = '^3.7.2';
  if (injectNestClient) {
    dep['nest-client'] = '^0.5.1';
  }
  if (ws) {
    dep['typestub-primus'] = '^1.1.3';
    dep['primus-emitter'] = '^3.1.1';
  }
  if (web) {
    dep.express = '^4.17.1';
    devDep['@types/express'] = '^4.17.1';
  }
  devDep['@types/cli-progress'] = '^1.8.1';
  devDep['@types/express-serve-static-core'] = '^4.16.7';
  json[dependencies] = sortObjectKey(dep);
  json[devDependencies] = sortObjectKey(devDep);
  const newText = JSON.stringify(json, null, 2);
  await writeFile(filename, newText);
}

async function setClientPackage(args: {
  projectDirname: string;
  ws: boolean;
  injectFormat: boolean;
}) {
  const { projectDirname, ws } = args;
  const filename = path.join(projectDirname, 'package.json');
  if (!(await hasFile(filename))) {
    await exec('npm init --yes', { cwd: projectDirname });
  }
  const bin = await readFile(filename);
  const text = bin.toString();
  const json = JSON.parse(text);
  setPackageJson({ ...args, packageJson: json });
  const dep = json[dependencies] || {};
  const devDep = json[devDependencies] || {};
  dep['nest-client'] = '^0.5.1';
  if (ws) {
    dep['typestub-primus'] = '^1.0.0';
  }
  json[dependencies] = sortObjectKey(dep);
  json[devDependencies] = sortObjectKey(devDep);
  const newText = JSON.stringify(json, null, 2);
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

async function genDocumentationHtmlFile(args: {
  outDirname: string;
  docDirname: string;
  clientDocFilename: string;
  adminDocFilename: string;
  internalDocFilename: string;
  baseProjectName: string;
  commandTypeName: string;
  queryTypeName: string;
  subscribeTypeName: string;
  clientCallTypes: CallMeta[];
  adminCallTypes: CallMeta[];
  internalCallTypes: CallMeta[];
  typeAlias: TypeAlias;
}) {
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
  injectFormat: true,
  asyncLogicProcessor: false,
  replayQuery: false,
  storeQuery: true,
  typeAlias: {},
  constants: {} as Constants,
  plugins: {} as GenProjectPlugins,
  omits: [],
};

export async function genProject(_args: {
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
  serverOrigin: {
    port: number;
    test: string;
    prod: string;
  };
  injectFormat?: boolean;
  asyncLogicProcessor?: boolean;
  replayQuery?: boolean;
  storeQuery?: boolean;
  typeAlias?: TypeAlias;
  constants?: Constants;
  plugins?: GenProjectPlugins;
  omits?: Array<'snapshot'>;
}) {
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
  } = __args;
  const { port } = serverOrigin;
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

  if (!(await hasNestProject(args))) {
    await runNestCommand({
      cwd: outDirname,
      cmd: `nest new --skip-install ${serverProjectName}`,
      errorMsg: `Failed to create nest project`,
    });
  }
  const serverSrcDirname = getSrcDirname({
    projectDirname: serverProjectDirname,
  });
  await Promise.all([
    mkdirp(path.join(serverProjectDirname, '.idea')),
    mkdirp(path.join(clientProjectDirname, '.idea')),
    mkdirp(path.join(adminProjectDirname, '.idea')),
    mkdirp(path.join(serverSrcDirname, typeDirname)),
    mkdirp(path.join(serverSrcDirname, logicProcessorDirname)),
    mkdirp(path.join(serverSrcDirname, libDirname)),
  ]);
  const dataWrapper: { logicProcessorCode: string } = {} as any;
  await Promise.all([
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
    updateGitIgnore({ projectDirname: serverProjectDirname }),
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
