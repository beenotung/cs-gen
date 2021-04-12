import { genCreateTableSql, genTsType, ObjectType } from './gen'
import { genCallTypes, linesToCode, ResultType } from '../../template/gen-code'

export type CallMeta = {
  CallType: string
  Type: string
  In: ObjectType
  Out: string
  Feed?: string // default is no feed
  Replay: boolean
  Async?: boolean // default is sync
}

let UsernameType: ObjectType = ['Username', [['username', 'text']]]
let EmptyType: ObjectType = ['Empty', []]

let FeedId = `{ feed_id: string }`

let calls: CallMeta[] = [
  {
    CallType: 'Command',
    Type: 'CreateUser',
    In: UsernameType,
    Out: ResultType(['username already used']),
    Replay: true,
  },
  {
    CallType: 'Query',
    Type: 'CheckUsername',
    In: UsernameType,
    Out: ResultType([], `{ used: boolean }`),
    Replay: false,
  },
  {
    CallType: 'Query',
    Type: 'GetAllUsernames',
    In: EmptyType,
    Out: ResultType([], `{ usernames: Array<string> }`),
    Replay: false,
  },
  {
    CallType: 'Subscribe',
    Type: 'SubscribeUsers',
    In: EmptyType,
    Out: ResultType([], FeedId),
    Feed: `{ username: string }`,
    Replay: false,
  },
  {
    CallType: 'Command',
    Type: 'CancelSubscribe',
    In: ['Feed', [['feed_id', 'text']]],
    Out: ResultType(),
    Replay: false,
  },
]

function genCode(): string {
  let tsTypes: Record<string, string> = {}
  calls.forEach(call => {
    let tsType = genTsType(call.In)
    let name = call.In[0]
    if (name in tsTypes) {
      if (tsTypes[name] === tsType) {
        return
      }
      console.log('conflicting types:', {
        versionA: tsTypes[name],
        versionB: tsType,
      })
      return
    }
    tsTypes[name] = tsType
    let sql = genCreateTableSql(call.In)
    console.log(sql)
  })
  let lines: string[] = []
  Object.values(tsTypes).forEach(line => {
    lines.push(line)
  })
  genCallTypes(
    calls.map(call => ({
      ...call,
      In: call.In[0],
    })),
  ).forEach(line => lines.push(line))
  return linesToCode(lines)
}
genCode()
