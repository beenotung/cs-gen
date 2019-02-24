import { getLocalStorage } from '@beenotung/tslib/store';
import { Random, base58Letters } from '@beenotung/tslib/random';
import { hashObject } from './hash';

let store = getLocalStorage('data');
let key = 'device_id';
export let deviceId: string = store.getItem(key);
if (!deviceId) {
  deviceId = hashObject(
    [Random.nextString(8, base58Letters), Date.now()].join(':'),
  );
  store.setItem(key, deviceId);
}
