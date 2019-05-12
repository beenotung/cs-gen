import { Call, CallType, Result } from './types';

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
