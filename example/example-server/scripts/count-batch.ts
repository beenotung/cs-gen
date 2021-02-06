#!/usr/bin/env ts-node
import { countBatch, iterateBatchKeys } from '../src/lib/batch';
import { logService } from './utils';

console.log('file count:', logService.getKeysSync().length);
console.log('call count:', countBatch(logService));

let keys = new Set<string>();
let key_count = 0;
for (let { key } of iterateBatchKeys(logService)) {
  key_count++;
  if (keys.has(key)) {
    console.log('duplicated key:', key);
  } else {
    keys.add(key);
  }
}
console.log('key counts:', key_count);
console.log('uniq  keys:', keys.size);
