export type CreateUser = {
  CallType: 'Command'
  Type: 'CreateUser'
  In: { username: string } & { Timestamp: number }
  Out: { Success: true } | { Success: false; Reason: 'username already used' }
  Replay: true
}

export type CheckUsername = {
  CallType: 'Query'
  Type: 'CheckUsername'
  In: { username: string } & { Timestamp: number }
  Out: { Success: true } & { used: boolean }
  Replay: false
}

export type SubscribeUsers = {
  CallType: 'Subscribe'
  Type: 'SubscribeUsers'
  In: { Timestamp: number }
  Out: { Success: true } & { feed_id: string }
  Replay: false
}

export type CancelSubscribe = {
  CallType: 'Command'
  Type: 'CancelSubscribe'
  In: { feed_id: string } & { Timestamp: number }
  Out: { Success: true }
  Replay: false
}

export type Command = CreateUser | CancelSubscribe

export type Query = CheckUsername

export type Subscribe = SubscribeUsers

export type Call = Command | Query | Subscribe

export let calls = [
  {
    CallType: 'Command',
    Type: 'CreateUser',
    In: '{ username: string } & { Timestamp: number }',
    Out:
      '{ Success: true } | { Success: false, Reason: "username already used" }',
    Replay: true,
  },
  {
    CallType: 'Query',
    Type: 'CheckUsername',
    In: '{ username: string } & { Timestamp: number }',
    Out: '{ Success: true } & { used: boolean }',
    Replay: false,
  },
  {
    CallType: 'Subscribe',
    Type: 'SubscribeUsers',
    In: '{ Timestamp: number }',
    Out: '{ Success: true } & { feed_id: string }',
    Feed: '{ username: string }',
    Replay: false,
  },
  {
    CallType: 'Command',
    Type: 'CancelSubscribe',
    In: '{ feed_id: string } & { Timestamp: number }',
    Out: '{ Success: true }',
    Replay: false,
  },
]

export type CallMeta = typeof calls[number]
