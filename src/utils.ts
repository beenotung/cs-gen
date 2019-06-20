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

export interface PartialCall<C extends Call = Call> {
  Type: C['Type'];
  In: C['In'];
  Out: C['Out'];
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

export function flattenCallTypes<_Call extends Call = Call>(args: {
  commandTypeName?: _Call['CallType'];
  queryTypeName?: _Call['CallType'];
  subscribeTypeName?: _Call['CallType'];

  commandTypes?: PartialCall[];
  queryTypes?: PartialCall[];
  subscribeTypes?: PartialCall[];
}): Call[] {
  args = Object.assign({}, defaultTypeName, args);
  const {
    commandTypeName,
    queryTypeName,
    subscribeTypeName,
    commandTypes,
    queryTypes,
    subscribeTypes,
  } = args;
  return [
    ...commandTypes.map(call => ({ CallType: commandTypeName, ...call })),
    ...queryTypes.map(call => ({ CallType: queryTypeName, ...call })),
    ...subscribeTypes.map(call => ({ CallType: subscribeTypeName, ...call })),
  ];
}
