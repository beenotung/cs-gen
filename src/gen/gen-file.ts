import { exec } from '@beenotung/tslib/child_process';
import {
  hasFile,
  readFile,
  writeFile as _writeFile,
} from '@beenotung/tslib/fs';
import mkdirp from 'async-mkdirp';
import * as path from 'path';
import { Call } from '../types';
import { genControllerCode, genServiceCode, genTypeCode } from './gen-code';

function writeFile(filename: string, code: string) {
  code = code.trim();
  code += '\n';
  return _writeFile(filename, code);
}

export function getServiceFilePathname(args: {
  projectDirname: string;
  serviceFilename: string;
  serviceDirname: string;
}) {
  const { serviceDirname, serviceFilename } = args;

  const projectDirname = args.projectDirname || 'out';
  const dirname = path.join(projectDirname, 'src', serviceDirname);
  return path.join(dirname, serviceFilename);
}

export function hasServiceFile(args: {
  projectDirname: string;
  serviceFilename: string;
  serviceDirname: string;
}): Promise<boolean> {
  const pathname = getServiceFilePathname(args);
  return hasFile(pathname);
}

export async function genServiceFile(args: {
  projectDirname: string;
  serviceFilename: string;
  serviceDirname: string;
  serviceClassName: string;
  typeDirname: string;
  typeFilename: string;
  typeNames: string[];
  callTypeName: string;
}) {
  const code = genServiceCode(args);
  const { serviceDirname, serviceFilename } = args;

  const projectDirname = args.projectDirname || 'out';
  const dirname = path.join(projectDirname, 'src', serviceDirname);
  await mkdirp(dirname);
  const pathname = path.join(dirname, serviceFilename);

  return writeFile(pathname, code);
}

export async function genControllerFile(args: {
  typeDirname: string;
  typeFilename: string;
  callTypeName: string;
  serviceClassName: string;
  serviceFilename: string;
  controllerClassName: string;
  serviceApiPath: string;
  callApiPath: string;
  controllerFilename: string;
  projectDirname: string;
  serviceDirname: string;
}) {
  const code = genControllerCode(args);
  const { serviceDirname, controllerFilename } = args;

  const projectDirname = args.projectDirname || 'out';
  const dirname = path.join(projectDirname, 'src', serviceDirname);
  await mkdirp(dirname);
  const pathname = path.join(dirname, controllerFilename);

  return writeFile(pathname, code);
}

export async function genTypeFile(args: {
  projectDirname: string;
  typeDirname: string;
  typeFilename: string;
  queryTypes: Call[];
  commandTypes: Call[];
  callTypeName: string;
  queryTypeName: string;
  commandTypeName: string;
}) {
  const code = genTypeCode(args);

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
  const text = `# EditorConfig helps developers define and maintain consistent coding styles between different editors and IDEs
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
indent_size = 2`;
  await writeFile(filename, text);
}

function hasNestProject(args: { projectDirname: string }): Promise<boolean> {
  const { projectDirname } = args;
  const filename = path.join(projectDirname, 'nest-cli.json');
  return hasFile(filename);
}

export const defaultGenProjectArgs = {
  outDirname: 'out',
  typeDirname: 'domain',
  typeFilename: 'types.ts',
  callTypeName: 'Call',
  queryTypeName: 'Query',
  commandTypeName: 'Command',
  serviceDirname: 'core',
  serviceFilename: 'core.service.ts',
  serviceClassName: 'CoreService',
  controllerFilename: 'core.controller.ts',
  controllerClassName: 'CoreController',
  serviceApiPath: 'core',
  callApiPath: 'call',
};

export async function genProject(_args: {
  outDirname?: string;
  projectName: string;
  typeDirname?: string;
  typeFilename?: string;
  queryTypes: Call[];
  commandTypes: Call[];
  callTypeName?: string;
  queryTypeName?: string;
  commandTypeName?: string;
  serviceFilename?: string;
  serviceDirname?: string;
  serviceClassName?: string;
  serviceAPIPath?: string;
  callApiPath?: string;
}) {
  const args = {
    ...defaultGenProjectArgs,
    ..._args,
  };
  const {
    outDirname,
    projectName,
    serviceDirname,
    queryTypes,
    commandTypes,
  } = args;
  await mkdirp(outDirname);
  const projectDirname = path.join(outDirname, projectName);

  if (!(await hasNestProject({ projectDirname }))) {
    await runNestCommand({
      cwd: outDirname,
      cmd: `nest new --skip-install ${projectName}`,
      errorMsg: `Failed to create nest project`,
    });
  }
  await mkdirp(path.join(projectDirname, '.idea'));
  await Promise.all([
    setTslint({ projectDirname }),
    setIdeaConfig({ projectDirname, projectName }),
    setEditorConfig({ projectDirname }),
  ]);
  if (!(await hasServiceFile({ ...args, projectDirname }))) {
    await runNestCommand({
      cwd: projectDirname,
      cmd: `nest g module ${serviceDirname}`,
      errorMsg: `Failed to create nest module`,
    });
    await runNestCommand({
      cwd: projectDirname,
      cmd: `nest g service ${serviceDirname}`,
      errorMsg: `Failed to create nest service`,
    });
  }

  await Promise.all([
    genTypeFile({ ...args, projectDirname }),
    genServiceFile({
      ...args,
      projectDirname,
      typeNames: [
        ...queryTypes.map(t => t.Type),
        ...commandTypes.map(t => t.Type),
      ],
    }),
    genControllerFile({ ...args, projectDirname }),
  ]);
}
