import { getMaxArraySize } from '@beenotung/tslib/array';
import { CachedObjectStore } from '@beenotung/tslib/cached-store';
import { readdir } from '@beenotung/tslib/fs';
import { NonVoidResultPool } from '@beenotung/tslib/result-pool';
import { compare_string } from '@beenotung/tslib/string';
import { Injectable } from '@nestjs/common';
import { readdirSync } from 'fs';
import mkdirp = require('mkdirp-sync');
import { Call, Result } from '../types';

@Injectable()
export class LogService {
  private now: number;
  private acc: number;
  private store: CachedObjectStore;
  private fsPool = new NonVoidResultPool(getMaxArraySize());

  constructor(private dataDirname: string) {
    mkdirp(dataDirname);
    this.store = CachedObjectStore.create(dataDirname);
  }

  getKeysSync(): string[] {
    return this.sortKeys(readdirSync(this.dataDirname));
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

  storeCall(call: Call): void {}

  storeObject(value): Result<void> {
    const key = this.nextKey();
    return this.fsPool.run(() => this.store.setObject(key, value));
  }

  // getObject<T>(key: string): Result<T | null> {
  //   return this.fsPool.run(()=>this.store.getObject(key));
  // }
  getObject<T>(key: string): T | null {
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
