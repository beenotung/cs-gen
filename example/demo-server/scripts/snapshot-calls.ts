#!/usr/bin/env ts-node
import * as path from 'path';
import { LogService } from '../src/lib/log.service';
import { makeSnapshot } from '../src/lib/snapshot';

let log = new LogService(path.join('data', 'log'));
console.log('begin make snapshot');
makeSnapshot(log);
console.log('finished make snapshot');
