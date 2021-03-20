import {
  CallMeta,
  genCallTypes,
  linesToCode,
  ResultType,
} from '../../template/gen-code'

let FeedId = `{ feed_id: string }`

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
    Out: ResultType([], `{ used: boolean }`),
    Replay: false,
  },
  {
    CallType: 'Subscribe',
    Type: 'SubscribeUsers',
    In: `{}`,
    Out: ResultType([], FeedId),
    Feed: `{ username: string }`,
    Replay: false,
  },
  {
    CallType: 'Command',
    Type: 'CancelSubscribe',
    In: FeedId,
    Out: ResultType(),
    Replay: false,
  },
]

function genCode(): string {
  return linesToCode(genCallTypes(calls))
}

genCode()
