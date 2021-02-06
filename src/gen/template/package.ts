import { readJsonFile, writeFile } from '@beenotung/tslib/fs';
import * as path from 'path';

export interface Package {
  scripts: { [name: string]: string };
  dependencies: { [name: string]: string };
  devDependencies: { [name: string]: string };
}

export async function updateRootPackageFile(args: {
  injectFormat: boolean;
  outDirname: string;
}) {
  if (!args.injectFormat) {
    return;
  }
  const filename = path.join(args.outDirname, 'package.json');
  const json: Package = await readJsonFile(filename);
  if (!json.scripts.format) {
    json.scripts.format = 'bash scripts/format';
    await writeFile(filename, JSON.stringify(json, null, 2));
  }
}
