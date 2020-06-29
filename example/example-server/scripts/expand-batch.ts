#!/usr/bin/env ts-node
import { expandBatch } from '../src/lib/batch';
import { logService } from './utils';

console.log('start expand batch');
expandBatch(logService);
console.log('finished expand batch');
