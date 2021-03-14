import { EOL } from 'os';
import { binArrayBy } from '@beenotung/tslib/array';

type Call = {
  CallType: string;
  Type: string;
  In: string;
  Out: string;
  Replay: boolean;
};

let calls: Call[] = [
  {
    CallType: 'Command',
    Type: 'CreateUser',
    In: `{ username: string }`,
    Out: Result(['username already used']),
    Replay: true,
  },
  {
    CallType: 'Query',
    Type: 'CheckUsername',
    In: `{ username: string }`,
    Out: `{ used: boolean }`,
    Replay: false,
  },
  {
    CallType: 'Subscribe',
    Type: 'SubscribeUsers',
    In: `{}`,
    Out: `{ username: string }`,
    Replay: false,
  },
];

function Result(Reasons: string[]) {
  let type = `{ Success: true }`;
  if (Reasons.length > 0) {
    let Reason = Reasons.map(s => JSON.stringify(s)).join(' | ');
    type += ` | { Success: false, Reason: ${Reason} }`;
  }
  return type;
}

function genCode() {
  let lines: string[] = [];
  calls.forEach(call => {
    lines.push(`export type ${call.Type} = {
  CallType: ${JSON.stringify(call.CallType)}
  Type: ${JSON.stringify(call.Type)}
  In: ${call.In}
  Out: ${call.Out}
  Replay: ${JSON.stringify(call.Replay)}
}`);
  });
  let callsByCallType = binArrayBy(calls, call => call.CallType);
  callsByCallType.forEach((calls, CallType) => {
    let names =
      calls.length === 0 ? 'never' : calls.map(call => call.Type).join(' | ');
    lines.push(`export type ${CallType} = ${names}`);
  });
  let names = Array.from(callsByCallType.keys()).join(' | ');
  lines.push(`export type Call = ${names}`);
  lines.push(`export let calls = ${JSON.stringify(calls, null, 2)}`);
  lines.push(`export type CallMeta = (typeof calls)[number]`);
  return lines.join(EOL + EOL).trim() + EOL;
}

genCode();
