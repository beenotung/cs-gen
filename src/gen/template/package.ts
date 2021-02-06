import { hasFile, readJsonFile, writeFile } from '@beenotung/tslib/fs';
import * as path from 'path';
import { Package } from '../helpers/package';

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
