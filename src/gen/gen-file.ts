import { exec } from '@beenotung/tslib/child_process';
import { writeFile } from '@beenotung/tslib/fs';
import * as path from 'path';
import { Call } from '../types';
import { genServiceCode, genTypeCode } from './gen-code';

const mkdirp = require('async-mkdirp');
const Service = 'Service';

function classNameToServiceName(className: string): string {
  let serviceName = className;
  if (className.length > Service.length && className.endsWith(Service)) {
    serviceName = className.replace(Service, '');
  }
  const head = serviceName[0] || '';
  const headLower = head.toLowerCase();
  if (head !== headLower) {
    serviceName = headLower + serviceName.substring(1);
  }
  return serviceName;
}

function serviceNameToClassName(serviceDirname: string): string {
  let className = serviceDirname;
  if (!className.endsWith(Service)) {
    className += Service;
  }
  const head = className[0] || '';
  const headUpper = head.toUpperCase();
  if (head !== headUpper) {
    className = headUpper + className.substring(1);
  }
  return className;
}

function getServiceArgs(args: {
  serviceFilename?: string;
  serviceDirname?: string;
  serviceClassName?: string;
}): {
  serviceFilename: string;
  serviceDirname: string;
  serviceClassName: string;
} {
  let { serviceDirname, serviceClassName } = args;
  if (!serviceDirname || !serviceClassName) {
    serviceDirname = 'core';
  }
  if (!serviceClassName) {
    serviceClassName = serviceNameToClassName(serviceDirname);
  }
  if (!serviceDirname) {
    serviceDirname = classNameToServiceName(serviceClassName);
  }
  const serviceFilename =
    args.serviceFilename || `${serviceDirname}.service.ts`;
  return { serviceDirname, serviceClassName, serviceFilename };
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
  if (stdout.indexOf('CREATE') == -1) {
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
  typeFilename: 'types',
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
