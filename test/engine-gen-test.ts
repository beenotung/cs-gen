import { writeFile } from '@beenotung/tslib/fs';
import { catchMain } from '@beenotung/tslib/node';
import { genEngine } from '../src/gen/engine-gen';
import { callTypes } from './gen-test';

export let eventTypes: string[] = ['UserCreated', 'ItemCreated'];

async function test() {
  const code = genEngine({
    callTypeName: 'Call',
    commandTypeName: 'Command',
    queryTypeName: 'Query',
    subscribeTypeName: 'Subscribe',
    eventTypeName: 'Event',
    callTypes,
    eventTypes,
  });
  writeFile('engine-out.ts', code);
}

catchMain(test());
