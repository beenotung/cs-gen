/**
 * this file contains common functions and constants used by typical projects' gen-project script
 * */
import { PartialCallMeta } from '../utils';

let app_id: string | undefined;

/**
 * only allow token of this app id
 * */
export function setAppId(appId: string) {
  app_id = appId;
}

export let commandTypes: PartialCallMeta[] = [];
export let queryTypes: PartialCallMeta[] = [];
export let subscribeTypes: PartialCallMeta[] = [];

function ReasonsToType(Reasons?: string[]): string {
  if (!Reasons || Reasons.length === 0) {
    return 'never';
  }
  return Array.from(new Set(Reasons))
    .map(s => JSON.stringify(s))
    .join(' | ');
}

export function ResultType(args: { Reasons?: string[]; Data?: string }) {
  const { Reasons, Data } = args;
  const ReasonType = ReasonsToType(Reasons);
  const SuccessType = Data ? `({Success:true} & (${Data}))` : `{Success: true}`;
  return `{Success: false, Reason: ${ReasonType}} | ${SuccessType}`;
}

export let InvalidToken = 'InvalidToken';
export let QuotaExcess = 'QuotaExcess';
export let NoPermission = 'NoPermission';
export let UserNotFound = 'UserNotFound';

function AttemptInType(In: string): string {
  return `(${In}) & {token: string}`;
}

function AuthInType(In: string): string {
  let Type = `(${In}) & `;
  if (app_id) {
    // only support a specific app_id, no need to specify
    Type += '`{user_id: string}';
  } else {
    // support multiple app id, need to specify
    Type += '`{app_id: string, user_id: string}';
  }
  return Type;
}

export function authCommand(args: {
  Type: string;
  In: string;
  Reasons: string[];
}) {
  const { Type, In, Reasons } = args;
  commandTypes.push({
    Type: 'Attempt' + Type,
    In: AttemptInType(In),
    Out: ResultType({ Reasons: [InvalidToken, ...Reasons] }),
  });
  commandTypes.push({
    Type: 'Auth' + Type,
    In: AuthInType(In),
    Out: ResultType({ Reasons }),
    Admin: true,
  });
}

export function authQuery(args: {
  Type: string;
  In: string;
  Reasons: string[];
  Data: string;
}) {
  const { Type, In, Reasons, Data } = args;
  queryTypes.push({
    Type: 'Attempt' + Type,
    In: AttemptInType(In),
    Out: ResultType({ Reasons: [InvalidToken, ...Reasons], Data }),
  });
  queryTypes.push({
    Type: 'Auth' + Type,
    In: AuthInType(In),
    Out: ResultType({ Reasons, Data }),
    Admin: true,
  });
}
