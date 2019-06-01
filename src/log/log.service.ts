import { NonVoidResultPool } from '@beenotung/tslib/result-pool';
import { compare_string } from '@beenotung/tslib/string';
import { Injectable } from '@nestjs/common';
import * as fs from 'graceful-fs';
import mkdirp = require('mkdirp-sync');
import * as util from 'util';

const readdir: typeof fs.readdir.__promisify__ = util.promisify(fs.readdir);
const writeFile: typeof fs.writeFile.__promisify__ = util.promisify(
  fs.writeFile,
);

function fixFS() {
  const realFs = require('fs');
  const gracefulFs = require('graceful-fs');
  gracefulFs.gracefulify(realFs);
}

@Injectable()
export class LogService {
  private now: number;
  private acc: number;
  // private store: AsyncStore;
  private fsPool = new NonVoidResultPool(8000);

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
        continue;
      }
      return this.sortKeys(ss);
    }
  }

  storeObject(value: any): void {
    const key = this.nextKey();
    // return this.fsPool.run(() => this.store.setObject(key, value));
    // this.store.setObject(key, value);
    writeFile(key, JSON.stringify(value));
  }

  // getObject<T>(key: string): Result<T | null> {
  //   return this.fsPool.run(()=>this.store.getObject(key));
  // }
  getObject<T>(key: string): Promise<T | null> {
    return this.store.getObject(key);
  }

  private sortKeys(ss: string[]): string[] {
    return ss.sort((a, b) => compare_string(a, b));
  }

  private nextKey(): string {
    const now = Date.now();
    if (this.now === now) {
      this.acc++;
    } else {
      this.now = now;
      this.acc = 0;
    }
    return this.now + '-' + this.acc;
  }
}
