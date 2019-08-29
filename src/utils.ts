import { Call, CallMeta, Result } from './types';

export function checkCallType(t: Call) {
  /* static type check only */
}

/* [object Promise] */
const promiseString = Promise.resolve().toString();

export function then<T, R>(x: Result<T>, f: (x: T) => Result<R>): Result<R> {
  const p = x as Promise<T>;
  if (p && typeof p === 'object' && p.toString() === promiseString) {
    return p.then(f);
  }
  return f(x as T);
}

export interface PartialCallMeta {
  Type: string;
  In: string;
  Out: string;
  Admin?: boolean;
}

export interface CallInput<C extends Call = Call> {
  CallType: C['CallType'];
  Type: C['Type'];
  In: C['In'];
}

export let defaultTypeName = {
  queryTypeName: 'Query',
  commandTypeName: 'Command',
  subscribeTypeName: 'Subscribe',
};

export function flattenCallMetas(args: {
  commandTypeName?: string;
  queryTypeName?: string;
  subscribeTypeName?: string;

  commandTypes?: PartialCallMeta[];
  queryTypes?: PartialCallMeta[];
  subscribeTypes?: PartialCallMeta[];
}): CallMeta[] {
  const {
    commandTypeName,
    queryTypeName,
    subscribeTypeName,
    commandTypes,
    queryTypes,
    subscribeTypes,
  } = { ...defaultTypeName, ...args };
  return [
    ...(commandTypes || []).map(call => ({
      CallType: commandTypeName,
      ...call,
    })),
    ...(queryTypes || []).map(call => ({ CallType: queryTypeName, ...call })),
    ...(subscribeTypes || []).map(call => ({
      CallType: subscribeTypeName,
      ...call,
    })),
  ];
}
