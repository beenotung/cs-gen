import { getStore } from '@beenotung/tslib/store';

function randomId(): string {
  return Math.random().toString(36).replace('0.', '');
}

function getDeviceId(): string {
  let key = 'device_id';
  let store = getStore();
  let id = store.getItem(key);
  if (id) {
    return id;
  }
  id = randomId();
  store.setItem(key, id);
  return id;
}

let deviceId = getDeviceId();
let counter = 0;
let lastTime = 0;

export function nextId(): string {
  let now = Date.now();
  if (now !== lastTime) {
    lastTime = now;
    counter = 0;
  }
  let id = `${now}-${counter}-${deviceId}`;
  counter++;
  return id;
}
