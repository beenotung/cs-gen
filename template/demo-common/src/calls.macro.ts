import {
  CallMeta,
  genCallTypes,
  linesToCode,
  ResultType,
} from '../../template/gen-code';

let calls: CallMeta[] = [
  {
    CallType: 'Command',
    Type: 'CreateUser',
    In: `{ username: string }`,
    Out: ResultType(['username already used']),
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

function genCode() {
  return linesToCode(genCallTypes(calls));
}

genCode();
