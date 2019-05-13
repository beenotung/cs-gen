import { LogService } from '../src';
import path = require('path');

let logService = new LogService(path.join('data', 'log'));
let n = 1;
for (;;) {
  console.log(`n : ${n}`);
  for (let i = 0; i < n; i++) {
    logService.storeObject({ n, i });
  }
  n *= 2;
}
