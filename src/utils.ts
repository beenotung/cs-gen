import { Call, CallType, Result } from './types';
import { JsonValue } from '@beenotung/tslib';

export function checkCallType(t: Call) {
  /* static type check only */
}

/* [object Promise] */
const promiseString = Promise.resolve().toString();

export function then<T, R>(x: Result<T>, f: (x: T) => Result<R>): Result<R> {
  if (x && x.toString() === promiseString) {
    return (x as Promise<T>).then(f);
  }
  return f(x as T);
}

export interface PartialCall<Type extends string = string, In = any, Out = any> {
  Type: Type;
  In: In;
  Out: Out;
}

const Command: CallType = 'Command';
const Query: CallType = 'Query';
const Mixed: CallType = 'Mixed';

export function flattenCallTypes(args: {
  queryTypes?: PartialCall[],
  commandTypes?: PartialCall[],
  mixedTypes?: PartialCall[],
}): Call[] {
  const {
    queryTypes,
    commandTypes,
    mixedTypes,
  } = args;
  return [
    ...(commandTypes || []).map(t => ({ ...t, CallType: Command })),
    ...(queryTypes || []).map(t => ({ ...t, CallType: Query })),
    ...(mixedTypes || []).map(t => ({ ...t, CallType: Mixed })),
  ];
}

/* name -> type */
const typeMap = new Map<string, string>();

export function setTsType(name: string, type: string): void {

}

export function getTsType(o: JsonValue): string {
  const type = typeof o;
  switch (type) {
    case 'string':
      if (typeMap.has(o)) {
        return typeMap.get(o);
      }
      return type;
    case 'number':
    case 'boolean':
    case 'bigint':
    case 'symbol':
    case 'undefined':
      return type;
    case 'object':
      if (Array.isArray(o)) {
        if(o.length<1){
          throw new TypeError('cannot determine type of empty array')
        }
        return `Array<${getTsType(o[0])}>`
      } else {

      }
    default:
      console.error('unknown type', { type, o });
      throw new TypeError('unknown type: ' + type);
  }
}
