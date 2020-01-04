#!/usr/bin/env ts-node
import * as path from 'path';
import { LogService } from '../src/lib/log.service';
import { deduplicateSnapshot } from '../src/lib/snapshot';

let log = new LogService(path.join('data', 'log'));
console.log('begin deduplicate snapshot');
deduplicateSnapshot(log);
console.log('finished deduplicate snapshot');
