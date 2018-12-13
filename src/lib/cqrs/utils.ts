import { id } from './types/data.types';

export function idToString(id: id): string {
  switch (typeof id) {
    case 'string':
      return id;
    case 'number':
    default:
      return id.toString();
  }
}
