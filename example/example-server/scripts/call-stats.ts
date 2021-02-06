#!/usr/bin/env ts-node
import { CallInput } from '../src/domain/types';
import { Bar } from 'cli-progress';
import { logService } from './utils';
import { iterateBatch } from '../src/lib/batch';

const callTypeCounts = new Map<string, number>();
const typeCounts = new Map<string, number>();
const calls = new Map<string, CallInput>();

console.log('scanning calls');
const bar = new Bar({});
bar.start(0, 0);
for (let { content, estimateTotal } of iterateBatch<CallInput>(logService)) {
  bar.setTotal(estimateTotal);
  bar.increment(1);
  const call = content;
  if (call === null) {
    continue;
  }
  if (call.Type.startsWith('Auth')) {
    continue;
  }
  if (call.Type.startsWith('Attempt')) {
    call.Type = call.Type.replace('Attempt', '') as any;
  }
  calls.set(call.Type, call);

  let key: string;
  let counts: Map<string, number>;

  key = call.Type;
  counts = typeCounts;
  counts.set(key, (counts.get(key) || 0) + 1);

  key = call.CallType;
  counts = callTypeCounts;
  counts.set(key, (counts.get(key) || 0) + 1);
}
bar.stop();

function adjustWidth(rows: string[][]): void {
  const lens = new Array(rows[0].length).fill(0);
  rows.forEach(cols => cols.forEach((col, i) => lens[i] = Math.max(lens[i], col.length)));
  rows.forEach(cols => cols.forEach((col, i) => {
    if (col.length < lens[i]) {
      cols[i] = ' '.repeat(lens[i] - col.length) + cols[i];
    }
  }));
}

let firstReport = true;

function report(name: string, counts: Map<string, number>) {
  if (firstReport) {
    firstReport = false;
  } else {
    console.log();
  }
  console.log(`== ${name} ==`);
  let rows: string[][];
  if (counts === callTypeCounts) {
    rows = [
      ['Percentage', 'Count', 'CallType'],
      ['----------', '-----', '--------'],
    ];
  } else {
    rows = [
      ['Percentage', 'Count', 'Type', 'CallType'],
      ['----------', '-----', '----', '--------'],
    ];
  }
  let total = 0;
  counts.forEach(count => total += count);
  const xs: Array<{ p: number, cols: string[] }> = [];
  counts.forEach((count, type) => {
    const p = Math.round(count / total * 100 * 100) / 100;
    const cols: string[] = [p + '%', count.toString(), type];
    const call = calls.get(type);
    if (call) {
      cols.push(call.CallType);
    }
    xs.push({ p, cols });
  });
  xs.sort((a, b) => -(a.p - b.p));
  xs.forEach(({ cols }) => rows.push(cols));
  adjustWidth(rows);
  rows.forEach(cols => console.log(cols.join(' \t')));
  console.log('='.repeat(`== ${name} ==`.length));
}

report('CallType', callTypeCounts);
report('Type', typeCounts);
