import { andType, ArrayType, orType } from 'gen-ts-type';
import { AuthPluginOptions, DefaultAuthConfig } from '../gen/plugins/auth';
import { CallMeta } from '../types';
import {
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
    const value =
      typeof constant === 'string' || typeof constant === 'number'
        ? constant
        : constant.value;
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

export let authConfig: AuthPluginOptions = DefaultAuthConfig;

export function setAuthConfig(_authConfig: AuthPluginOptions) {
  authConfig = _authConfig;
}

/** @deprecated use authConfig or setAuthConfig() instead */
export function checkAppId(appId?: string) {
  authConfig.AppId = appId;
}

export function FailType(Reasons?: string[]): string {
  Reasons = Array.from(new Set(Reasons));
  const reasonType =
    Reasons.length > 0
      ? Reasons.map(reason => JSON.stringify(reason)).join(' | ')
      : 'never';
  return `{ Success: false, Reason: ${reasonType} }`;
}

function InjectAuthReasons({
  Reasons,
  ExtraAuthReasons,
}: {
  Reasons?: string[];
  ExtraAuthReasons?: string[];
}): string[] {
  // FIXME add InvalidAppId, InvalidUserId, NetworkError for better error handling
  return authConfig.AppId
    ? // any app_id is allowed
      [InvalidToken, ...(Reasons || [])]
    : // only a specific app_id is allowed
      [
        InvalidToken,
        InvalidAppId,
        ...(ExtraAuthReasons || []),
        ...(Reasons || []),
      ];
}

export function SuccessType(Out?: string): string {
  const OutType = Out ? Out : '{}';
  return andType(`{ Success: true }`, OutType);
}

export function ResultType(Reasons?: string[], Out?: string): string {
  return orType(FailType(Reasons), SuccessType(Out));
}

function genInjectAuthInType(): string {
  const user_id = authConfig.InjectUserId ? 'user_id: string' : '';
  const app_id =
    authConfig.InjectAppId && !authConfig.AppId ? 'app_id: string' : '';
  const fields = [user_id, app_id].filter(s => s).join(', ');
  if (fields) {
    return `{ ${fields} }`;
  }
  return '{}';
}

function authCall(
  types: PartialCallMeta[],
  call: {
    Type: string;
    In?: string;
    Reasons?: string[];
    ExtraAuthReasons?: string[];
    Out?: string;
    Admin?: boolean;
    OptionalAuth?: boolean;
  },
) {
  const { Type, Reasons, Out, Admin, OptionalAuth } = call;
  const InType = call.In || '{}';

  let { ExtraAuthReasons } = call;
  if (authConfig.AppId) {
    ExtraAuthReasons = [InvalidAppId, ...(ExtraAuthReasons || [])];
  }
  const attemptOutType = ResultType(
    InjectAuthReasons({ Reasons, ExtraAuthReasons }),
    Out,
  );

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
  const injectAuthInType: string = genInjectAuthInType();
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
  ExtraAuthReasons?: string[];
  Admin?: boolean;
  OptionalAuth?: boolean;
}) {
  return authCall(commandTypes, call);
}

export function authQuery(call: {
  Type: string;
  In?: string;
  Reasons?: string[];
  ExtraAuthReasons?: string[];
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
  ExtraAuthReasons?: string[];
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
