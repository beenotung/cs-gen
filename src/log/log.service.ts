import { later } from '@beenotung/tslib/async/wait';
import { compare_string } from '@beenotung/tslib/string';
import { Injectable } from '@nestjs/common';
import * as fs from 'graceful-fs';
import * as path from 'path';
import * as util from 'util';
// tslint:disable:no-var-requires
const mkdirp = require('mkdirp-sync');
// tslint:enable:no-var-requires

const readdir: typeof fs.readdir.__promisify__ = util.promisify(fs.readdir);
const writeFile: typeof fs.writeFile.__promisify__ = util.promisify(
  fs.writeFile,
);
const readFile: typeof fs.readFile.__promisify__ = util.promisify(fs.readFile);

function fixFS() {
  const realFs = require('fs');
  const gracefulFs = require('graceful-fs');
  gracefulFs.gracefulify(realFs);
}

@Injectable()
export class LogService {
  private now?: number;
  private acc?: number;
  // private store: AsyncStore;
  // private fsPool = new NonVoidResultPool(8000);

  constructor(private dataDirname: string) {
    fixFS();
    mkdirp(dataDirname);
    // this.store = CachedObjectStore.create(dataDirname);
    // this.store = Store.create(getLocalStorage(dataDirname));
    // this.store = AsyncStore.create(dataDirname)
  }

  getKeysSync(): string[] {
    return this.sortKeys(fs.readdirSync(this.dataDirname));
  }

  async getKeys(): Promise<string[]> {
    for (;;) {
      const ss = await readdir(this.dataDirname);
      if (ss.some(s => s.indexOf('.') !== -1)) {
        console.log('waiting temp files to be cleared in', this.dataDirname);
        await later(1000);
        continue;
      }
      return this.sortKeys(ss);
    }
  }

  /**
   * key cannot contains dot '.'
   * */
  storeObjectSync(value: any, key: string): void {
    fs.writeFileSync(this.keyToPath(key), JSON.stringify(value));
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
  async getObject<T>(key: string): Promise<T | null> {
    // return this.store.getObject(key);
    const bin = await readFile(this.keyToPath(key));
    const text = bin ? bin.toString() : null;
    return JSON.parse(text!);
  }

  nextKey(): string {
    const now = Date.now();
    if (this.now === now) {
      this.acc!++;
    } else {
      this.now = now;
      this.acc = 0;
    }
    return this.now + '-' + this.acc;
  }

  private keyToPath(key: string) {
    return path.join(this.dataDirname, key);
  }

  private sortKeys(ss: string[]): string[] {
    return ss.sort((a, b) => compare_string(a, b));
  }
}
