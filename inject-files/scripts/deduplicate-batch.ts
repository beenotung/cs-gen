#!/usr/bin/env ts-node
import { deduplicateBatch } from '../src/lib/batch';
import { logService } from './utils';

console.log('start deduplicate batch');
deduplicateBatch(logService);
console.log('finished deduplicate batch');
