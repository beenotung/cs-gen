#!/usr/bin/env ts-node
/**
 * to expand legacy snapshot file into individual call logs
 *
 * 'snapshot' is deprecated in favour of 'batch' for simplicity and better naming
 * */
import { join } from 'path';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { Bar } from 'cli-progress';
import { logService } from './utils';

// [key, json string]
type batch = [string, string][]
let Suffix = '-Snapshot';

let dirname = join('data', 'log');
let keys = logService.getKeysSync();
let bar = new Bar({});
bar.start(keys.length, 0);

function expand(key: string, content: string) {
  console.log();
  console.log('expanding', key);
  const batch = JSON.parse(content) as batch;
  for (let [key, content] of batch) {
    if (key.endsWith(Suffix)) {
      expand(key, content);
      continue;
    }
    writeFileSync(join(dirname, key), content);
  }
  console.log('expanded', key);
}

for (let key of keys) {
  if (!key.endsWith(Suffix)) {
    bar.increment(1);
    continue;
  }
  let filename = join(dirname, key);
  let content = readFileSync(filename).toString();
  expand(key, content);
  unlinkSync(filename);
  bar.increment(1);
}
bar.stop();
console.log('expanded all');
