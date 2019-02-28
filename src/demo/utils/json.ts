import { getObjectType } from '@beenotung/tslib/type';
import { JsonArray, JsonObject, JsonPrimitive, JsonValue } from '../core/util-types';

/**
 * check to enforce the result is json value (e.g. without Map, Set, undefined)
 * return cloned value
 * */
export function ensureJsonValue<T>(o: T): T & JsonValue {
  let type = getObjectType(o);
  switch (type) {
    case 'Number':
    case 'String':
    case 'Null':
      return o as JsonPrimitive & T;
    case 'Array':
      return (o as unknown as any[]).map(x => ensureJsonValue(x)) as unknown as JsonArray & T;
    case 'Object': {
      let result = {};
      Object.keys(o).forEach(x => result[x] = ensureJsonValue(o[x]));
      return result as JsonObject & T;
    }
  }
  console.error('expected json value, but got:', o);
  throw new TypeError('expected json value, but got typeof: ' + type);
}
