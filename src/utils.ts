import { Call, Result } from './types';

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

export interface PartialCall<
  Type extends string = string,
  In = any,
  Out = any
> {
  Type: Type;
  In: In;
  Out: Out;
}

export interface PartialSubscribeCall<Type extends string = string, In = any> {
  Type: Type;
  In: In;
}

export function flattenCallTypes(args: {
  commandTypes?: PartialCall[];
  queryTypes?: PartialCall[];
  subscribeTypes?: PartialSubscribeCall[];
}): Call[] {
  const { commandTypes, queryTypes, subscribeTypes } = args;
  const calls: Call[] = [];
  if (commandTypes) {
    commandTypes.forEach(call => calls.push({ CallType: 'Command', ...call }));
  }
  if (queryTypes) {
    queryTypes.forEach(call => calls.push({ CallType: 'Query', ...call }));
  }
  if (subscribeTypes) {
    subscribeTypes.forEach(call =>
      calls.push({ CallType: 'Subscribe', ...call }),
    );
  }
  return calls;
}
