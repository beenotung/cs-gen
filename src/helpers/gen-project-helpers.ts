import { CallMeta } from '../types';
import { flattenCallMetas, PartialCallMeta } from '../utils';

export const InvalidToken = 'InvalidToken';
export const InvalidAppId = 'InvalidAppId';
export const QuotaExcess = 'QuotaExcess';
export const NoPermission = 'NoPermission';
export const UserNotFound = 'UserNotFound';

export const Admin = true;

export let commandTypes: PartialCallMeta[] = [];
export let queryTypes: PartialCallMeta[] = [];
export let subscribeTypes: PartialCallMeta[] = [];

// only allow token of this app_id
export let app_id: string | undefined;

export function checkAppId(appId?: string) {
  app_id = appId;
}

export function FailType(Reasons: string[]): string {
  return Reasons && Reasons.length > 0
    ? `{ Success: false, Reason: ${Reasons.map(Reason =>
        JSON.stringify(Reason),
      ).join(' | ')} }`
    : `{ Success: false }`;
}

function InjectReasons(Reasons?: string[]): string[] {
  return app_id
    ? // any app_id is allowed
      [InvalidToken, ...(Reasons || [])]
    : // only a specific app_id is allowed
      [InvalidToken, InvalidAppId, ...(Reasons || [])];
}
function SuccessType(Out?: string): string {
  return Out ? `{ Success: true } & (${Out})` : `{ Success: true }`;
}
export function authCall(
  types: PartialCallMeta[],
  call: {
    Type: string;
    In?: string;
    Reasons?: string[];
    Out?: string;
    AdminOnly?: boolean;
  },
) {
  const { Type, In, Reasons, Out, AdminOnly } = call;
  const InType = In ? In : `{}`;
  const _SuccessType = SuccessType(Out);
  types.push({
    Type: 'Attempt' + Type,
    In: `(${InType}) & { token: string }`,
    Out: `${FailType(InjectReasons(Reasons))} | ${_SuccessType}`,
    Admin: !!AdminOnly,
  });
  const InjectIn: string = app_id
    ? // explicit to be the current app
      `{ user_id: string }`
    : // can be any app
      `{ user_id: string, app_id: string }`;
  types.push({
    Type: 'Auth' + Type,
    In: `(${InType}) & ${InjectIn}`,
    Out: `${FailType(Reasons)} | ${_SuccessType}`,
    Admin: true,
  });
}

export function authCommand(call: {
  Type: string;
  In?: string;
  Reasons?: string[];
  AdminOnly?: boolean;
}) {
  return authCall(commandTypes, call);
}

export function authQuery(call: {
  Type: string;
  In?: string;
  Reasons?: string[];
  Out: string;
  AdminOnly?: boolean;
}) {
  return authCall(queryTypes, call);
}

export function authSubscribe(call: {
  Type: string;
  In?: string;
  Reasons?: string[];
  Out: string;
  AdminOnly?: boolean;
}) {
  const { Type, In, Reasons, Out, AdminOnly } = call;
  subscribeTypes.push({
    Type,
    In: `(${In}) & { token: string }`,
    Out: `${FailType(InjectReasons(Reasons))} | ${SuccessType(Out)}`,
    Admin: AdminOnly,
  });
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

export function enableSubscription() {
  commandTypes.push({
    Type: 'CancelSubscribe',
    In: '{ id: string }',
    Out: `${FailType([
      // not using spark
      'no active session matched',
      // not started or already cancelled
      'no active channel matched',
    ])} | { Success: true }`,
  });
}
