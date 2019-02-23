import { new_counter } from '@beenotung/tslib';
import { deviceId } from './device';

let counter = new_counter(0);
let lastCounterTimestamp = 0;

function getCounter(): number {
  let timestamp = Date.now();
  if (lastCounterTimestamp !== timestamp) {
    lastCounterTimestamp = timestamp;
    counter = new_counter(0);
  }
  return counter.next();
}

export function genId(): string {
  return [
    deviceId,
    Date.now(),
    getCounter(),
  ].join(':');
}
