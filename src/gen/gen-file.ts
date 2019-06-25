import { exec } from '@beenotung/tslib/child_process';
import { compare } from '@beenotung/tslib/compare';
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
  genMainCode,
  genModuleCode,
  genServiceCode,
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
  projectDirname: string;
  moduleDirname: string;
}): string {
  const { moduleDirname } = args;
  return path.join(getSrcDirname(args), moduleDirname);
}

async function genLogicProcessorFile(args: {
  outDirname: string;
  projectDirname: string;
  logicProcessorDirname: string;
  logicProcessorFilename: string;
  logicProcessorClassName: string;
  dataWrapper: { logicProcessorCode: string };
}): Promise<void> {
  const {
    logicProcessorDirname,
    logicProcessorFilename,
    logicProcessorClassName,
    dataWrapper,
  } = args;
  const filename = path.join(
    getSrcDirname(args),
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
  projectDirname: string;
  moduleDirname: string;
}): Promise<void> {
  const filename = path.join(getModuleDirname(args), 'connection.ts');
  const code = genConnectionCode();
  await writeFile(filename, code);
}

async function genServiceFile(args: {
  outDirname: string;
  projectDirname: string;
  moduleDirname: string;
  serviceFilename: string;
  serviceClassName: string;
  typeDirname: string;
  typeFilename: string;
  callTypes: CallMeta[];
  callTypeName: string;
  commandTypeName: string;
  queryTypeName: string;
  subscribeTypeName: string;
  logicProcessorDirname: string;
  logicProcessorFilename: string;
  logicProcessorClassName: string;
  logicProcessorCode: string;
}) {
  const { serviceFilename } = args;
  const code = genServiceCode(args);
  const filename = path.join(getModuleDirname(args), serviceFilename);

  return writeFile(filename, code);
}

async function genControllerFile(args: {
  outDirname: string;
  projectDirname: string;
  moduleDirname: string;
  typeDirname: string;
  typeFilename: string;
  callTypeName: string;
  commandTypeName: string;
  serviceClassName: string;
  serviceFilename: string;
  controllerClassName: string;
  serviceApiPath: string;
  callApiPath: string;
  controllerFilename: string;
}) {
  const { controllerFilename } = args;
  const code = genControllerCode(args);
  const filename = path.join(getModuleDirname(args), controllerFilename);

  return writeFile(filename, code);
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

  return writeFile(pathname, code);
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
  projectDirname: string;
  moduleDirname: string;
  moduleFilename: string;
  moduleClassName: string;
  serviceFilename: string;
  serviceClassName: string;
  controllerFilename: string;
  controllerClassName: string;
}) {
  const { projectDirname, moduleDirname, moduleFilename } = args;
  const code = genModuleCode(args);
  const filename = path.join(getModuleDirname(args), moduleFilename);
  if (!(await hasFile(filename))) {
    await runNestCommand({
      cwd: projectDirname,
      cmd: `nest g module ${moduleDirname}`,
      errorMsg: `Failed to create nest module`,
    });
  }
  await writeFile(filename, code);
}

async function updateMainFile(args: { projectDirname: string }) {
  const srcPath = getSrcDirname(args);
  const mainPath = path.join(srcPath, 'main.ts');
  const originalMainCode = (await readFile(mainPath)).toString();
  const newMainCode = genMainCode(originalMainCode);
  if (originalMainCode.trim() !== newMainCode.trim()) {
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
  callApiPath: string;
  callTypeName: string;
  subscribeTypeName: string;
  callTypes: CallMeta[];
  timestampFieldName: string;
  injectTimestamp: boolean;
}) {
  const { outDirname, clientProjectName, apiDirname, apiFilename } = args;
  const dirPath = path.join(outDirname, clientProjectName, 'src', apiDirname);
  await mkdirp(dirPath);
  const filePath = path.join(dirPath, apiFilename);
  const code = genClientLibCode(args);
  await writeFile(filePath, code);
}

async function setTslint(args: { projectDirname: string }) {
  const { projectDirname } = args;
  const filename = path.join(projectDirname, 'tslint.json');
  const bin = await readFile(filename);
  const text = bin.toString();
  const json = JSON.parse(text);
  /* move the key to the first slot */
  json.rules = {
    'interface-over-type-literal': false,
    ...json.rules,
  };
  /* override existing value */
  json.rules['interface-over-type-literal'] = false;
  const newText = JSON.stringify(json, null, 2);
  // /* preserve compact formatting */
  // const newText = text.replace('  "rules": {\n','  "rules": {\n    "interface-over-type-literal": false,\n');
  await writeFile(filename, newText);
}

function setPackageDependency(
  json: object,
  depType: 'dependencies' | 'devDependencies',
  name: string,
  version: string,
): void {
  json[depType][name] = version;
  const newDep = {};
  Object.entries(json[depType])
    .sort(([k1, v1], [k2, v2]) => compare(k1, k2))
    .forEach(([k, v]) => (newDep[k] = v));
  json[depType] = newDep;
}

async function setPackage(args: { projectDirname: string }) {
  const { projectDirname } = args;
  const filename = path.join(projectDirname, 'package.json');
  const bin = await readFile(filename);
  const text = bin.toString();
  const json = JSON.parse(text);
  setPackageDependency(json, 'dependencies', 'cli-progress', '^2.1.1');
  setPackageDependency(json, 'dependencies', 'engine.io', '^3.3.2');
  setPackageDependency(json, 'dependencies', 'engine.io-client', '^3.3.2');
  setPackageDependency(json, 'dependencies', 'primus', '^7.3.3');
  setPackageDependency(json, 'dependencies', 'primus-emitter', '^3.1.1');
  setPackageDependency(
    json,
    'devDependencies',
    '@types/cli-progress',
    '^1.8.1',
  );
  const newText = JSON.stringify(json, null, 2);
  await writeFile(filename, newText);
}

async function setIdeaConfig(args: {
  projectDirname: string;
  projectName: string;
}) {
  const { projectDirname, projectName } = args;

  const projectFilename = path.join(
    projectDirname,
    '.idea',
    projectName + '.iml',
  );
  const projectFileContent = `<?xml version="1.0" encoding="UTF-8"?>
<module type="JAVA_MODULE" version="4">
  <component name="NewModuleRootManager" inherit-compiler-output="true">
    <exclude-output />
    <content url="file://$MODULE_DIR$">
      <sourceFolder url="file://$MODULE_DIR$/src" isTestSource="false" />
      <sourceFolder url="file://$MODULE_DIR$/test" isTestSource="true" />
      <excludeFolder url="file://$MODULE_DIR$/dist" />
      <excludeFolder url="file://$MODULE_DIR$/data" />
    </content>
    <orderEntry type="inheritedJdk" />
    <orderEntry type="sourceFolder" forTests="false" />
  </component>
</module>`;

  const moduleFilename = path.join(projectDirname, '.idea', 'modules.xml');
  const moduleFileContent = `<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="ProjectModuleManager">
    <modules>
      <module fileurl="file://$PROJECT_DIR$/.idea/${projectName}.iml" filepath="$PROJECT_DIR$/.idea/${projectName}.iml" />
    </modules>
  </component>
</project>`;

  await Promise.all([
    writeFile(projectFilename, projectFileContent),
    writeFile(moduleFilename, moduleFileContent),
  ]);
}

async function setEditorConfig(args: { projectDirname: string }) {
  const { projectDirname } = args;
  const filename = path.join(projectDirname, '.editorconfig');
  const text = `
# EditorConfig helps developers define and maintain consistent coding styles between different editors and IDEs
# http://editorconfig.org

root = true

[*]
indent_style = space
indent_size = 2

# We recommend you to keep these unchanged
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false

[*.xml]
indent_style = space
indent_size = 4

[*.json]
indent_style = space
indent_size = 2
`;
  await writeFile(filename, text);
}

function hasNestProject(args: { projectDirname: string }): Promise<boolean> {
  const { projectDirname } = args;
  const filename = path.join(projectDirname, 'nest-cli.json');
  return hasFile(filename);
}

export function injectTimestampField(args: {
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

export const defaultGenProjectArgs = {
  outDirname: 'out',
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
  serviceApiPath: 'core',
  callApiPath: 'Call',
  logicProcessorDirname: 'domain',
  apiDirname: 'domain',
  apiFilename: 'api.ts',
  logicProcessorFilename: 'logic-processor.ts',
  logicProcessorClassName: 'LogicProcessor',
  timestampFieldName: 'Timestamp',
  injectTimestamp: true,
};

export async function genProject(_args: {
  outDirname?: string;
  serverProjectName: string;
  clientProjectName: string;
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
  serviceAPIPath?: string;
  callApiPath?: string;
  logicProcessorDirname?: string;
  logicProcessorFilename?: string;
  logicProcessorClassName?: string;
  apiDirname?: string;
  apiFilename?: string;
  timestampFieldName?: string;
  injectTimestamp?: boolean;
}) {
  const __args = {
    ...defaultGenProjectArgs,
    ..._args,
  };
  const {
    outDirname,
    serverProjectName,
    clientProjectName,
    typeDirname,
    logicProcessorDirname,
    injectTimestamp,
    timestampFieldName,
    callTypes,
  } = __args;
  await mkdirp(outDirname);
  const serverProjectDirname = path.join(outDirname, serverProjectName);
  const clientProjectDirname = path.join(outDirname, clientProjectName);
  const args = {
    ...__args,
    projectDirname: serverProjectDirname,
  };

  if (injectTimestamp) {
    callTypes.forEach(call =>
      injectTimestampField({ call, timestampFieldName }),
    );
  }

  if (!(await hasNestProject(args))) {
    await runNestCommand({
      cwd: outDirname,
      cmd: `nest new --skip-install ${serverProjectName}`,
      errorMsg: `Failed to create nest project`,
    });
  }
  const srcDirname = getSrcDirname(args);
  await Promise.all([
    mkdirp(path.join(serverProjectDirname, '.idea')),
    mkdirp(path.join(clientProjectDirname, '.idea')),
    mkdirp(path.join(srcDirname, typeDirname)),
    mkdirp(path.join(srcDirname, logicProcessorDirname)),
  ]);
  if (!'dev') {
    await scanProject(args);
    return;
  }
  const dataWrapper: { logicProcessorCode: string } = {} as any;
  await Promise.all([
    genLogicProcessorFile({ ...args, dataWrapper }),
    setTslint(args),
    setPackage(args),
    setIdeaConfig({
      projectDirname: serverProjectDirname,
      projectName: serverProjectName,
    }),
    setIdeaConfig({
      projectDirname: clientProjectDirname,
      projectName: clientProjectName,
    }),
    setEditorConfig(args),
    genTypeFile({
      ...args,
      projectDirname: serverProjectDirname,
    }),
    genTypeFile({
      ...args,
      projectDirname: clientProjectDirname,
    }),
    updateMainFile(args),
    updateGitIgnore(args),
    genClientLibFile(args),
  ]);
  await genModuleFile(args);
  await Promise.all([
    genConnectionFile(args),
    genServiceFile({
      ...args,
      logicProcessorCode: dataWrapper.logicProcessorCode,
    }),
    genControllerFile(args),
  ]);
  // TODO refactor core controller to call logic processor
}
