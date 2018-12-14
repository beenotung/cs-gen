import { new_counter } from '@beenotung/tslib';

const idCounter = new_counter();

export function genId() {
  return Date.now() + '-' + idCounter.next();
}
