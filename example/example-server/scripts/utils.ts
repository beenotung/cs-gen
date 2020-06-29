import * as fs from 'fs';
import * as path from 'path';
import { LogService } from '../src/lib/log.service';

export function saveFile(filename: string, data: string | Buffer) {
  fs.writeFileSync(filename, data);
  console.log('saved to', filename);
}

export let logService = new LogService(path.join('data', 'log'));
