import { exec } from '@beenotung/tslib/child_process';
import { writeFile, writeFile as _writeFile } from '@beenotung/tslib/fs';
import path from 'path';

export interface Package {
  scripts: { [name: string]: string };
  devDependencies: { [name: string]: string };
}

export function getSrcDirname(args: { projectDirname: string }): string {
  const { projectDirname } = args;
  return path.join(projectDirname, 'src');
}

export function getModuleDirname(args: {
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

export function wrapResult(
  type: string,
  args: {
    asyncLogicProcessor: boolean;
  },
) {
  return args.asyncLogicProcessor ? `Result<${type}>` : type;
}

export function formatCode(code: string) {
  return code.trim().replace(/\n\n\n/g, '\n\n');
}

export async function saveCode(filename: string, code: string) {
  code = formatCode(code);
  await writeFile(filename, code);
}

export async function saveExe(filename: string, code: string) {
  code = code.trim();
  code += '\n';
  await _writeFile(filename, code);
  await exec('chmod +x ' + JSON.stringify(filename));
}
