import { hasFile, readJsonFile, writeFile } from '@beenotung/tslib/fs';
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
  let pkg: Package;
  if (await hasFile(filename)) {
    pkg = await readJsonFile(filename);
  } else {
    pkg = {} as any;
  }
  if (!pkg.scripts) {
    pkg.scripts = {};
  }
  if (!pkg.scripts.format) {
    pkg.scripts.format = 'bash scripts/format';
    await writeFile(filename, JSON.stringify(pkg, null, 2));
  }
}
