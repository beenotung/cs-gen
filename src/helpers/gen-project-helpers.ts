import { andType, ArrayType } from 'gen-ts-type';
import { AuthPluginOptions, DefaultAuthConfig } from '../gen/plugins/auth';
import { CallMeta } from '../types';
import {
  Constant,
  Constants,
  flattenCallMetas,
  PartialCallMeta,
  TypeAlias,
} from '../utils';
import { InvalidAppId, InvalidToken } from './constants';

export let typeAlias: TypeAlias = {};

const type = (typeStr: string): string => {
  for (const [name, type] of Object.entries(typeAlias)) {
    if (typeStr === type) {
      return name;
    }
  }
  console.warn('type not register as alias: ' + typeStr);
  return typeStr;
};
const typeArray = (typeStr: string): string => ArrayType(type(typeStr));

export function alias(_typeAlias: TypeAlias) {
  Object.assign(typeAlias, _typeAlias);
  return {
    type,
    typeArray,
  };
}

export let constants: Constants = {};

const ref = (constantVal: any): string => {
  for (const [name, constant] of Object.entries(constants)) {
    const value = typeof constant === 'string' ? constant : constant.value;
    if (constantVal === value) {
      return name;
    }
  }
  console.warn('constant not register:', constantVal);
  return JSON.stringify(constantVal, null, 2);
};

export function def(_constants: Constants) {
  Object.assign(constants, _constants);
  return { ref };
}

export let commandTypes: PartialCallMeta[] = [];
export let queryTypes: PartialCallMeta[] = [];
export let subscribeTypes: PartialCallMeta[] = [];

// only allow token of this app_id
export let check_app_id: string | undefined;

export function checkAppId(appId?: string) {
  check_app_id = appId;
}

export function FailType(Reasons?: string[]): string {
  return Reasons && Reasons.length > 0
    ? `{ Success: false, Reason: ${Reasons.map(Reason =>
        JSON.stringify(Reason),
      ).join(' | ')} }`
    : `{ Success: false }`;
}

function InjectAuthReasons(Reasons?: string[]): string[] {
  return check_app_id
    ? // any app_id is allowed
      [InvalidToken, ...(Reasons || [])]
    : // only a specific app_id is allowed
      [InvalidToken, InvalidAppId, ...(Reasons || [])];
}

export function SuccessType(Out?: string): string {
  const OutType = Out ? Out : '{}';
  return andType(`{ Success: true }`, OutType);
}

export function ResultType(Reasons?: string[], Out?: string): string {
  return `(${FailType(Reasons)}) | (${SuccessType(Out)})`;
}

export let authConfig: AuthPluginOptions = DefaultAuthConfig;

export function setAuthConfig(_authConfig: AuthPluginOptions) {
  authConfig = _authConfig;
}

function legacyAuthCall(
  types: PartialCallMeta[],
  call: {
    Type: string;
    In?: string;
    Reasons?: string[];
    Out?: string;
    Admin?: boolean;
    OptionalAuth?: boolean;
  },
) {
  const { Type, In, Reasons, Out, Admin } = call;
  const InType = In ? In : `{}`;

  // Attempt Call
  const attemptOutType = ResultType(InjectAuthReasons(Reasons), Out);
  types.push({
    Type: authConfig.AttemptPrefix + Type,
    In: andType(InType, `{ token: string }`),
    Out: attemptOutType,
    Admin,
    Internal: call.OptionalAuth,
    RequiredAuth: true,
  });

  // Auth Call
  const InjectAuthInType: string = check_app_id
    ? // explicit to be the current app
      `{ user_id: string }`
    : // can be any app
      `{ user_id: string, app_id: string }`;
  types.push({
    Type: authConfig.AuthPrefix + Type,
    In: andType(InType, InjectAuthInType),
    Out: ResultType(Reasons, Out),
    Admin,
    Internal: true,
  });

  // Optional Auth Call
  if (call.OptionalAuth) {
    types.push({
      Type,
      In: andType(InType, `{ token: string | undefined | null }`),
      Out: attemptOutType,
      Admin,
      Internal: false,
      OptionalAuth: true,
    });
  }
}

export function newAuthCall(
  types: PartialCallMeta[],
  call: {
    Type: string;
    In?: string;
    Reasons?: string[];
    Out?: string;
    Admin?: boolean;
    OptionalAuth?: boolean;
  },
) {
  if (authConfig.ExposeAttemptPrefix) {
    return legacyAuthCall(types, call);
  }

  const { Type, Reasons, Out, Admin } = call;
  const InType = call.In || '{}';

  // Attempt Call for Client API
  const injectAttemptInType = call.OptionalAuth
    ? `{ token: string | undefined | null }`
    : `{ token: string }`;
  const attemptOutType = ResultType(InjectAuthReasons(Reasons), Out);
  types.push({
    Type,
    In: andType(InType, injectAttemptInType),
    Out: attemptOutType,
    Admin,
    Internal: false,
    OptionalAuth: true,
  });

  // Virtual Attempt Call for Server Side Logic
  types.push({
    Type: authConfig.AttemptPrefix + Type,
    In: andType(InType, `{ token: string }`),
    Out: attemptOutType,
    Admin,
    Internal: true,
    RequiredAuth: true,
  });

  // Internal Auth Call for Server Side State
  const injectAuthInType: string = check_app_id
    ? // explicit to be the current app
      `{ user_id: string }`
    : // can be any app
      `{ user_id: string, app_id: string }`;
  types.push({
    Type: authConfig.AuthPrefix + Type,
    In: andType(InType, injectAuthInType),
    Out: ResultType(Reasons, Out),
    Admin,
    Internal: true,
  });
}

function authCall(
  types: PartialCallMeta[],
  call: {
    Type: string;
    In?: string;
    Reasons?: string[];
    Out?: string;
    Admin?: boolean;
    OptionalAuth?: boolean;
  },
) {
  const { Type, Reasons, Out, Admin, OptionalAuth } = call;
  const InType = call.In || '{}';

  const attemptOutType = ResultType(InjectAuthReasons(Reasons), Out);

  // Virtual Attempt Call for Server Side Logic or Legacy API for client
  types.push({
    Type: authConfig.AttemptPrefix + Type,
    In: andType(InType, `{ token: string }`),
    Out: attemptOutType,
    Admin,
    Internal: !authConfig.ExposeAttemptPrefix || OptionalAuth,
    RequiredAuth: true,
  });

  // Internal Auth Call for Server Side State
  const injectAuthInType: string = check_app_id
    ? // explicit to be the current app
      `{ user_id: string }`
    : // can be any app
      `{ user_id: string, app_id: string }`;
  types.push({
    Type: authConfig.AuthPrefix + Type,
    In: andType(InType, injectAuthInType),
    Out: ResultType(Reasons, Out),
    Admin,
    Internal: true,
  });

  // Attempt Call for Client API
  if (OptionalAuth || !authConfig.ExposeAttemptPrefix) {
    const injectAttemptInType = call.OptionalAuth
      ? `{ token: string | undefined | null }`
      : `{ token: string }`;
    types.push({
      Type,
      In: andType(InType, injectAttemptInType),
      Out: attemptOutType,
      Admin,
      Internal: false,
      OptionalAuth,
    });
  }
}

export function authCommand(call: {
  Type: string;
  In?: string;
  Reasons?: string[];
  Admin?: boolean;
  OptionalAuth?: boolean;
}) {
  return authCall(commandTypes, call);
}

export function authQuery(call: {
  Type: string;
  In?: string;
  Reasons?: string[];
  Out: string;
  Admin?: boolean;
  OptionalAuth?: boolean;
}) {
  return authCall(queryTypes, call);
}

export function authSubscribe(call: {
  Type: string;
  In?: string;
  Reasons?: string[];
  Out: string;
  Admin?: boolean;
  OptionalAuth?: boolean;
}) {
  return authCall(subscribeTypes, call);
}

export function callTypes(
  args: {
    commandTypeName?: string;
    queryTypeName?: string;
    subscribeTypeName?: string;
  } = {},
): CallMeta[] {
  const { commandTypeName, queryTypeName, subscribeTypeName } = args;
  return flattenCallMetas({
    commandTypeName,
    queryTypeName,
    subscribeTypeName,
    commandTypes,
    queryTypes,
    subscribeTypes,
  });
}

export const CancelSubscribe: PartialCallMeta = {
  Type: 'CancelSubscribe',
  In: '{ id: string }',
  Out: `${FailType([
    // not using spark
    'no active session matched',
    // not started or already cancelled
    'no active channel matched',
  ])} | { Success: true }`,
};

/** @deprecated copy in-place into gen-project.ts instead of invoke this function to avoid breaking changes */
export function enableSubscription() {
  commandTypes.push(CancelSubscribe);
}
