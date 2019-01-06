import { base58Letters, Random } from '@beenotung/tslib/random';
import { new_counter } from '@beenotung/tslib/uuid';
import { id } from './types';

export function idToString(id: id): string {
  if (id === null || id === undefined) {
    throw new Error('undefined id');
  }
  return String(id);
}

const session = Random.nextString(4, base58Letters);
const counter = new_counter();

export function genId(): id {
  return [
    session,
    Date.now(),
    counter,
  ].join('-');
}
