import { exec } from '@beenotung/tslib/child_process';
import { writeFile as _writeFile } from '@beenotung/tslib/fs';
import mkdirp from 'async-mkdirp';
import * as path from 'path';
import { Call } from '../types';
import { genServiceCode, genTypeCode } from './gen-code';

function writeFile(filename: string, code: string) {
  code = code.trim();
  code += '\n';
  return _writeFile(filename, code);
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

const defaultArgs = {
  outDirname: 'out',
  typeDirname: 'domain',
  typeFilename: 'types.ts',
  callTypeName: 'Call',
  queryTypeName: 'Query',
  commandTypeName: 'Command',
  serviceFilename: 'core.service.ts',
  serviceDirname: 'core',
  serviceClassName: 'CoreService',
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
}) {
  const args = {
    ...defaultArgs,
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

  await runNestCommand({
    cwd: outDirname,
    cmd: `nest new --skip-install ${projectName}`,
    errorMsg: `Failed to create nest project`,
  });
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

  await genTypeFile({
    ...args,
    projectDirname,
  });
  await genServiceFile({
    ...args,
    projectDirname,
    typeNames: [
      ...queryTypes.map(t => t.Type),
      ...commandTypes.map(t => t.Type),
    ],
  });
}
