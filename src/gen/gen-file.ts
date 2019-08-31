import { exec } from '@beenotung/tslib/child_process';
import {
  hasFile,
  readFile,
  writeFile as _writeFile,
} from '@beenotung/tslib/fs';
import mkdirp from 'async-mkdirp';
import * as path from 'path';
import { CallMeta } from '../types';
import { defaultTypeName, PartialCallMeta } from '../utils';
import {
  genCallTypeCode,
  genClientLibCode,
  genConnectionCode,
  genControllerCode,
  genDocumentationHtmlCode,
  genMainCode,
  genModuleCode,
  genServiceCode,
  genStatusCode,
} from './gen-code';
import { scanProject } from './scanner';

async function writeFile(filename: string, code: string) {
  code = code.trim();
  code += '\n';
  await _writeFile(filename, code);
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
}): Promise<void> {
  const filename = path.join(getModuleDirname(args), 'connection.ts');
  const code = genConnectionCode();
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

async function genControllerFile(args: {
  outDirname: string;
  serverProjectDirname: string;
  moduleDirname: string;
  typeDirname: string;
  typeFilename: string;
  callTypeName: string;
  commandTypeName: string;
  queryTypeName: string;
  serviceClassName: string;
  serviceFilename: string;
  controllerClassName: string;
  staticControllerReference: boolean;
  serviceApiPath: string;
  callApiPath: string;
  controllerFilename: string;
  statusFilename: string;
  statusName: string;
  ws: boolean;
  asyncLogicProcessor: boolean;
  replayQuery: boolean;
}) {
  const { controllerFilename } = args;
  const code = genControllerCode(args);
  const filename = path.join(getModuleDirname(args), controllerFilename);

  await writeFile(filename, code);
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
}) {
  const code = genCallTypeCode(args);

  const typeDirname = args.typeDirname || 'domain';
  const typeFilename = args.typeFilename || 'types.ts';
  const projectDirname = args.projectDirname || 'out';
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
  primusGlobalName: string;
  primusPath: string;
  ws: boolean;
}) {
  const srcPath = getSrcDirname(args);
  const mainPath = path.join(srcPath, 'main.ts');
  const originalCode = (await readFile(mainPath)).toString();
  const newMainCode = genMainCode({
    ...args,
    originalCode,
  });
  if (originalCode.trim() !== newMainCode.trim()) {
    await writeFile(mainPath, newMainCode);
  }
}

async function updateGitIgnore(args: { projectDirname: string }) {
  const { projectDirname } = args;
  const filePath = path.join(projectDirname, '.gitignore');
  let text = (await readFile(filePath)).toString();
  text = text
    .split('\n')
    .filter(s => s !== '/.idea')
    .join('\n');
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
  timestampFieldName: string;
  injectTimestampOnClient: boolean;
  primusGlobalName: string;
  primusPath: string;
  ws: boolean;
  serverOrigin?: string;
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
let tslib_tsconfig: string;
let tslib_package: Package;
let tslib_editorconfig: string;
let tslib_prettierrc: string;

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
    readFile(path.join(tslib_dirname, 'tsconfig.json')).then(
      bin => (tslib_tsconfig = bin.toString()),
    ),
    readFile(path.join(tslib_dirname, 'package.json')).then(
      bin => (tslib_package = JSON.parse(bin.toString())),
    ),
    readFile(path.join(tslib_dirname, '.editorconfig')).then(
      bin => (tslib_editorconfig = bin.toString()),
    ),
    readFile(path.join(tslib_dirname, '.prettierrc')).then(
      bin => (tslib_prettierrc = bin.toString()),
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
  const filename = path.join(projectDirname, 'tsconfig.json');
  if (await hasFile(filename)) {
    return;
  }
  await writeFile(filename, tslib_tsconfig);
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
  injectFormat: boolean;
}) {
  const { serverProjectDirname, ws } = args;
  const filename = path.join(serverProjectDirname, 'package.json');
  const bin = await readFile(filename);
  const text = bin.toString();
  const json = JSON.parse(text);
  setPackageJson({ ...args, packageJson: json });
  const dep = json[dependencies] || {};
  const devDep = json[devDependencies] || {};
  dep['cli-progress'] = '^2.1.1';
  dep.nestlib = '^0.3.1';
  dep['engine.io'] = '^3.3.2';
  dep['engine.io-client'] = '^3.3.2';
  if (ws) {
    dep['typestub-primus'] = '^1.1.3';
    dep['primus-emitter'] = '^3.1.1';
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
  dep['nest-client'] = '^0.5.0';
  if (ws) {
    devDep['typestub-primus'] = '^1.0.0';
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
        .map(
          dir =>
            `<sourceFolder url="file://$MODULE_DIR$/${dir}" isTestSource="false" />`,
        )
        .join('\n      ')}
      ${testDirs
        .map(
          dir =>
            `<sourceFolder url="file://$MODULE_DIR$/${dir}" isTestSource="true" />`,
        )
        .join('\n      ')}
      ${excludeDirs
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
  baseProjectName: string;
  serverProjectName: string;
  clientProjectName: string;
  adminProjectName: string;
}) {
  const {
    baseProjectName,
    serverProjectName,
    clientProjectName,
    adminProjectName,
  } = args;
  await Promise.all([
    writeFile(
      path.join('.idea', baseProjectName + '.iml'),
      genIdeaModuleIml({
        excludeDirs: [serverProjectName, clientProjectName, adminProjectName],
      }),
    ),
    writeFile(
      path.join('.idea', 'modules.xml'),
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
        excludeDirs: ['dist', 'data'],
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
  const filename = path.join(projectDirname, '.editorconfig');
  await writeFile(filename, tslib_editorconfig);
}

async function setPrettierrc(args: {
  projectDirname: string;
  injectFormat: boolean;
}) {
  const { projectDirname, injectFormat } = args;
  if (!injectFormat) {
    return;
  }
  const filename = path.join(projectDirname, '.prettierrc');
  await writeFile(filename, tslib_prettierrc);
}

function hasNestProject(args: {
  serverProjectDirname: string;
}): Promise<boolean> {
  const { serverProjectDirname } = args;
  const filename = path.join(serverProjectDirname, 'nest-cli.json');
  return hasFile(filename);
}

export function injectTimestampFieldOnCall(args: {
  call: PartialCallMeta;
  timestampFieldName: string;
}): void {
  const { call, timestampFieldName } = args;
  let { In } = call;
  if (In.includes(timestampFieldName)) {
    return;
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
  call.In = In;
}

async function genDocumentationHtmlFile(args: {
  outDirname: string;
  docDirname: string;
  clientDocFilename: string;
  adminDocFilename: string;
  baseProjectName: string;
  commandTypeName: string;
  queryTypeName: string;
  subscribeTypeName: string;
  callTypes: CallMeta[];
}) {
  const {
    outDirname,
    docDirname,
    clientDocFilename,
    adminDocFilename,
    callTypes,
  } = args;
  const dirname = path.join(outDirname, docDirname);
  await mkdirp(dirname);
  {
    const filename = path.join(dirname, clientDocFilename);
    const code = genDocumentationHtmlCode({
      ...args,
      role: 'Client',
      callTypes: callTypes.filter(x => !x.Admin),
    });
    await writeFile(filename, code);
  }
  {
    const filename = path.join(dirname, adminDocFilename);
    const code = genDocumentationHtmlCode({
      ...args,
      role: 'Admin',
      callTypes: callTypes.filter(x => x.Admin),
    });
    await writeFile(filename, code);
  }
}

export const defaultGenProjectArgs = {
  outDirname: 'out',
  docDirname: '',
  typeDirname: 'domain',
  typeFilename: 'types.ts',
  callTypeName: 'Call',
  queryTypeName: defaultTypeName.queryTypeName,
  commandTypeName: defaultTypeName.commandTypeName,
  subscribeTypeName: defaultTypeName.subscribeTypeName,
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
  timestampFieldName: 'Timestamp',
  injectTimestampField: true,
  injectTimestampOnClient: true,
  primusGlobalName: 'Primus',
  primusPath: '/primus',
  ws: true,
  injectFormat: true,
  asyncLogicProcessor: false,
  replayQuery: false,
};

export async function genProject(_args: {
  outDirname?: string;
  docDirname?: string;
  clientDocFilename?: string;
  adminDocFilename?: string;
  baseProjectName: string;
  serverProjectName?: string;
  clientProjectName?: string;
  adminProjectName?: string;
  typeDirname?: string;
  typeFilename?: string;
  callTypes: CallMeta[];
  callTypeName?: string;
  commandTypeName?: string;
  queryTypeName?: string;
  subscribeTypeName?: string;
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
  apiDirname?: string;
  apiFilename?: string;
  timestampFieldName?: string;
  injectTimestampField?: boolean;
  injectTimestampOnClient?: boolean;
  primusGlobalName?: string;
  primusPath?: string;
  ws?: boolean;
  serverOrigin?: string;
  injectFormat?: boolean;
  asyncLogicProcessor?: boolean;
  replayQuery?: boolean;
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
  };
  const {
    outDirname,
    serverProjectName,
    clientProjectName,
    adminProjectName,
    typeDirname,
    logicProcessorDirname,
    injectTimestampField,
    timestampFieldName,
    callTypes,
  } = __args;
  await mkdirp(outDirname);
  const serverProjectDirname = path.join(outDirname, serverProjectName);
  const clientProjectDirname = path.join(outDirname, clientProjectName);
  const adminProjectDirname = path.join(outDirname, adminProjectName);
  const args = {
    ...__args,
    serverProjectDirname,
  };

  if (injectTimestampField) {
    callTypes.forEach(call =>
      injectTimestampFieldOnCall({ call, timestampFieldName }),
    );
  }

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
  ]);
  if (!'dev') {
    await scanProject(args);
    return;
  }
  const dataWrapper: { logicProcessorCode: string } = {} as any;
  await Promise.all([
    genDocumentationHtmlFile(args),
    genLogicProcessorFile({
      ...args,
      dataWrapper,
    }),
    initTslib(args).then(() => Promise.all([]) as any),
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
    updateMainFile({ ...args, projectDirname: serverProjectDirname }),
    updateGitIgnore({ projectDirname: serverProjectDirname }),
    genTypeFile({
      ...args,
      projectDirname: serverProjectDirname,
    }),
    genTypeFile({
      ...args,
      projectDirname: clientProjectDirname,
      callTypes: callTypes.filter(call => !call.Admin),
    }),
    genTypeFile({
      ...args,
      projectDirname: adminProjectDirname,
      callTypes: callTypes.filter(call => call.Admin),
    }),
    genClientLibFile({
      ...args,
      clientProjectName,
      callTypes: callTypes.filter(call => !call.Admin),
    }),
    genClientLibFile({
      ...args,
      clientProjectName: adminProjectName,
      callTypes: callTypes.filter(call => call.Admin),
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
    genControllerFile(args),
  ]);
  await initTslib(args);
  await Promise.all([
    setServerPackage(args),
    setClientPackage({ ...args, projectDirname: clientProjectDirname }),
    setClientPackage({ ...args, projectDirname: adminProjectDirname }),
    ...(([] as Array<Promise<void>>).concat.apply(
      [],
      [serverProjectDirname, clientProjectDirname, adminProjectDirname].map(
        projectDirname => [
          setTslint({ ...args, projectDirname }),
          setTsconfig({ ...args, projectDirname }),
          setEditorConfig({ ...args, projectDirname }),
          setPrettierrc({ ...args, projectDirname }),
        ],
      ),
    ) as Array<Promise<any>>),
  ]);
}
