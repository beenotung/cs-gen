import { id } from './types';

export function idToString(id: id): string {
  if (id === null || id === undefined) {
    throw new Error('undefined id');
  }
  return String(id);
}
