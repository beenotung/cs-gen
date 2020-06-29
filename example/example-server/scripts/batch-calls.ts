#!/usr/bin/env ts-node
import { batchCalls } from '../src/lib/batch';
import { logService } from './utils';

console.log('begin batch calls');
batchCalls(logService);
console.log('finished batch calls');
