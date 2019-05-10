import { LogService } from '../src';
import { catchMain } from '@beenotung/tslib/node';

let logService = new LogService();
logService.storeObject(1);
logService.storeObject(2);
logService.storeObject(3);
logService.storeObject(4);

console.log('real-time keys:', logService.getKeysSync());
catchMain(logService.getKeys().then(ss => console.log('async keys:', ss)));