import { genCreateTableSql, genTsType, ObjectField, ObjectType, toTsTypeNae } from './gen'
import { genCallTypes, linesToCode, ResultType } from '../../template/gen-code'

export type CallMeta = {
  CallType: string
  Type: string
  In: ObjectField[]
  Out: string
  Feed?: string // default is no feed
  Replay: boolean
  Async?: boolean // default is sync
}

let calls: CallMeta[] = [
  {
    CallType: 'Command',
    Type: 'create_user',
    In: [['username','text'],['email','text']],
    Out: ResultType(['username already used']),
    Replay: true,
  },
  {
    CallType: 'Command',
    Type: 'change_username',
    In: [['from_username','text'],['to_username','text']],
    Out: ResultType(['username already used']),
    Replay: true,
  },
  {
    CallType: 'Query',
    Type: 'check_username_exist',
    In: [['username','text']],
    Out: ResultType([], `{ used: boolean }`),
    Replay: false,
  },
  {
    CallType: 'command',
    Type: 'console_error',
    In: [['user_agent','text']],
    Out: ResultType([], `{ usernames: Array<string> }`),
    Replay: false,
  },
  {
    CallType: 'Subscribe',
    Type: 'SubscribeUsers',
    In: [],
    Out: ResultType([], `{ feed_id: string }`),
    Feed: `{ username: string }`,
    Replay: false,
  },
  {
    CallType: 'Command',
    Type: 'CancelSubscribe',
    In: [['feed_id', 'text']],
    Out: ResultType(),
    Replay: false,
  },
]

function genCode(): string {
  let tsTypes: Record<string, string> = {}
  calls.forEach(call => {
    let name = call.Type
    let tsType = genTsType([name,call.In])
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
    let sql = genCreateTableSql([name,call.In])
    console.log(sql)
  })
  let lines: string[] = []
  Object.values(tsTypes).forEach(line => {
    lines.push(line)
  })
  genCallTypes(
    calls.map(call => ({
      ...call,
      In:toTsTypeNae(call.Type),
    })),
  ).forEach(line => lines.push(line))
  return linesToCode(lines)
}
genCode()
