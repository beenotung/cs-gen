import { Call, CallMeta } from './types';

export function checkCallType(t: Call) {
  /* static type check only */
}

export interface PartialCallMeta {
  Type: string;
  In: string;
  Out: string;
  Admin?: boolean;
  Internal?: boolean;
  OptionalAuth?: boolean;
  RequiredAuth?: boolean;
  Replay?: boolean;
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
  | number
  | {
      value: any;
      type?: string;
    }
  | any;

export interface Constants {
  [name: string]: Constant;
}
