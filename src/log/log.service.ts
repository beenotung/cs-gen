import { Injectable } from '@nestjs/common';
import * as fs from 'graceful-fs';
import * as path from 'path';
import * as util from 'util';
// tslint:disable:no-var-requires
const mkdirp = require('mkdirp-sync');
// tslint:enable:no-var-requires

const writeFile: typeof fs.writeFile.__promisify__ = util.promisify(
  fs.writeFile,
);
const readFile: typeof fs.readFile.__promisify__ = util.promisify(fs.readFile);

function patchFS() {
  const realFs = require('fs');
  const gracefulFs = require('graceful-fs');
  gracefulFs.gracefulify(realFs);
}

function patchError() {
  Object.assign(Error.prototype, {
    toJSON() {
      // tslint:disable-next-line no-invalid-this
      return this.toString();
    },
  });
}

// inline @beenotung/tslib/string.compare_string
export function compareKeys(a: string, b: string): 1 | 0 | -1 {
  const as = a.split('-');
  const bs = b.split('-');
  const an = as.length;
  const bn = bs.length;
  const n = Math.min(an, bn);
  for (let i = 0; i < n; i++) {
    const a = as[i];
    const b = bs[i];
    if (a < b) {
      return -1;
    }
    if (a > b) {
      return 1;
    }
  }
  if (an < bn) {
    return -1;
  }
  if (an > bn) {
    return 1;
  }
  return 0;
}
export function parseLogObject<T>(content: string | null): T | null {
  return content ? JSON.parse(content) : null;
}
@Injectable()
export class LogService {
  static readonly keySeparator = '-';
  private now?: number;
  private acc?: number;
  // private store: AsyncStore;
  // private fsPool = new NonVoidResultPool(8000);

  constructor(private dataDirname: string) {
    patchFS();
    patchError();
    mkdirp(dataDirname);
    // this.store = CachedObjectStore.create(dataDirname);
    // this.store = Store.create(getLocalStorage(dataDirname));
    // this.store = AsyncStore.create(dataDirname)
  }

  getKeysSync(): string[] {
    return this.sortKeys(fs.readdirSync(this.dataDirname));
  }

  getKeys(): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      const run = () => {
        fs.readdir(this.dataDirname, (err, ss) => {
          if (err) {
            // ready using graceful-fs, so don't need to retry
            reject(err);
            return;
          }
          if (ss.some(s => s.includes('.'))) {
            console.log(
              'waiting temp files to be cleared in',
              this.dataDirname,
            );
            setTimeout(run, 1000);
            return;
          }
          resolve(this.sortKeys(ss));
        });
      };
      run();
    });
  }

  /**
   * key cannot contains dot '.'
   * */
  storeStringSync(value: string, key: string): void {
    fs.writeFileSync(this.keyToPath(key), value);
  }

  /**
   * key cannot contains dot '.'
   * */
  storeObjectSync(value: any, key: string): void {
    return this.storeStringSync(JSON.stringify(value), key);
  }

  /**
   * key cannot contains dot '.'
   * */
  async storeObject(value: any, key: string): Promise<void> {
    // return this.fsPool.run(() => this.store.setObject(key, value));
    // this.store.setObject(key, value);
    return writeFile(this.keyToPath(key), JSON.stringify(value));
  }

  // getObject<T>(key: string): Result<T | null> {
  //   return this.fsPool.run(()=>this.store.getObject(key));
  // }

  getObjectSync<T>(key: string): T | null {
    const bin = fs.readFileSync(this.keyToPath(key));
    return parseLogObject(bin.toString());
  }

  getBinSync(key: string): Buffer {
    return fs.readFileSync(this.keyToPath(key));
  }

  getBinSizeSync(key: string): number {
    return fs.statSync(this.keyToPath(key)).size;
  }

  async getObject<T>(key: string): Promise<T | null> {
    // return this.store.getObject(key);
    const bin = await readFile(this.keyToPath(key));
    return parseLogObject(bin.toString());
  }

  nextKey(suffix?: string): string {
    const now = Date.now();
    if (this.now === now) {
      this.acc!++;
    } else {
      this.now = now;
      this.acc = 0;
    }
    return LogService.makeKey({
      timestamp: now,
      acc: this.acc!,
      suffix,
    });
  }

  removeObjectSync(key: string) {
    fs.unlinkSync(this.keyToPath(key));
  }

  private keyToPath(key: string) {
    return path.join(this.dataDirname, key);
  }

  private sortKeys(ss: string[]): string[] {
    return ss.sort(compareKeys);
  }

  static makeKey(args: {
    timestamp: number;
    acc: number;
    suffix?: string;
  }): string {
    let key = args.timestamp + '-' + args.acc;
    if (args.suffix) {
      key += '-' + args.suffix;
    }
    return key;
  }
}
