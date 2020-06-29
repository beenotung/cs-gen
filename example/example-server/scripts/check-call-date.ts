#!/usr/bin/env ts-node
/**
 * to check missing call logs
 * */
import { Bar } from 'cli-progress';
import { iterateBatch } from '../src/lib/batch';
import { logService } from './utils';
import { incMap } from '@beenotung/tslib/map';

function keyToDate(key: string) {
  return new Date(+key.split('-')[0]).toLocaleDateString();
}

let fileDates = new Map<string, number>();
let keys = logService.getKeysSync();
keys.forEach(key => incMap(fileDates, keyToDate(key)));
console.log({
  total: keys.length,
  fileDates,
});

let callDates = new Map<string, number>();
let total = 0;
let lastTime = '';
let bar = new Bar({});
bar.start(0, 0);
for (let { key, estimateTotal } of iterateBatch(logService)) {
  bar.setTotal(estimateTotal);
  total++;
  lastTime = keyToDate(key);
  incMap(callDates, lastTime);
}
bar.stop();
console.log({
  total,
  lastTime,
  callDates,
});
