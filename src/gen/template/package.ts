import { readJsonFile, writeFile } from '@beenotung/tslib/fs';
import * as path from 'path';
import { Package } from './helpers';

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
