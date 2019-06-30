import * as fs from 'fs';
import * as path from 'path';
import { Call } from '../src/domain/types';
import { sum } from '@beenotung/tslib/array';

let dirname = path.join('data', 'log');
let filenames: string[] = fs.readdirSync(dirname);
let callTypeCounts = new Map<string, number>();
let typeCounts = new Map<string, number>();
let calls = new Map<string, Call>();
for (let filename of filenames) {
  let pathname = path.join(dirname, filename);
  let bin = fs.readFileSync(pathname);
  let text = bin.toString();
  let call: Call = JSON.parse(text);
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

function report(name: string, counts: Map<string, number>) {
  let total = sum(Array.from(counts.values()));
  console.log(`== ${name} ==`);
  let xs: { p: number, s: string } [] = [];
  counts.forEach((value, key) => {
    let p = Math.round(value / total * 100 * 100) / 100;
    let s = (`${p}% \t ${value} \t ${key}`);
    let call = calls.get(key);
    if (call) {
      s = (`${p}% \t ${value} \t ${key}     \t (${call.CallType})`);
    }
    xs.push({ p, s });
  });
  xs.sort((a, b) => -(a.p - b.p));
  xs.forEach(({ s }) => console.log(s));
  console.log(`== ${name} ==`.replace(/./g, '='));
}

report('CallType', callTypeCounts);
report('Type', typeCounts);
