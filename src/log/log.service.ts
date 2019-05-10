import { CachedObjectStore } from '@beenotung/tslib/cached-store';
import { readdir } from '@beenotung/tslib/fs';
import { compare_string } from '@beenotung/tslib/string';
import { Injectable } from '@nestjs/common';
import { readdirSync } from 'fs';
import mkdirp = require('mkdirp-sync');
import * as path from 'path';

@Injectable()
export class LogService {
  private now: number;
  private acc: number;
  private store: CachedObjectStore;

  constructor(private dataDirname: string = path.join('data', 'log')) {
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

  storeObject(value): void {
    const key = this.nextKey();
    this.store.setObject(key, value);
  }

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
