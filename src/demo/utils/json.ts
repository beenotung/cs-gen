import { getObjectType } from '@beenotung/tslib/type';
import { JsonValue } from '../core/util-types';

/**
 * check to enforce the result is json value (e.g. without Map, Set, undefined)
 * return cloned value
 * */
export function ensureJsonValue<T>(o: T): T & JsonValue {
  const type = getObjectType(o);
  switch (type) {
    case 'String':
    case 'Number':
    case 'Null':
    case 'Undefined':
      return o as any;
    case 'Array':
      return (o as any as any[]).map(x => ensureJsonValue(x)) as any;
    case 'Object': {
      const res = {};
      Object.keys(o).forEach(x => res[x] = ensureJsonValue(o[x]));
      return res as any;
    }
    default:
      console.error('expected json value, but got:', o);
      throw new TypeError('expected json value, but got typeof: ' + type);
  }
}
