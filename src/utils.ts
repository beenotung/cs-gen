import { Call, CallMeta, Result } from './types';

export function checkCallType(t: Call) {
  /* static type check only */
}

export function isPromise(x: Result<any>): boolean {
  const p = x as Promise<any>;
  return (
    x instanceof Promise ||
    (p && typeof p === 'object' && typeof p.then === 'function')
  );
}

export function then<T, R>(x: Result<T>, f: (x: T) => Result<R>): Result<R> {
  const p = x as Promise<T>;
  if (
    x instanceof Promise ||
    (p && typeof p === 'object' && typeof p.then === 'function')
  ) {
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

export interface TypeAlias {
  [name: string]: string;
}

export type Constant =
  | string
  | {
      value: any;
      type?: string;
    };

export interface Constants {
  [name: string]: Constant;
}
