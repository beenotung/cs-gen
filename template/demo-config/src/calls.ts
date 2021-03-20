export type CreateUser = {
  CallType: 'Command'
  Type: 'CreateUser'
  In: { username: string }
  Out: { Success: true } | { Success: false; Reason: 'username already used' }
  Replay: true
  Async: false
}

export type CheckUsername = {
  CallType: 'Query'
  Type: 'CheckUsername'
  In: { username: string }
  Out: { Success: true } & { used: boolean }
  Replay: false
  Async: false
}

export type SubscribeUsers = {
  CallType: 'Subscribe'
  Type: 'SubscribeUsers'
  In: {}
  Out: { Success: true } & { feed_id: string }
  Feed: { username: string }
  Replay: false
  Async: false
}

export type CancelSubscribe = {
  CallType: 'Command'
  Type: 'CancelSubscribe'
  In: { feed_id: string }
  Out: { Success: true }
  Replay: false
  Async: false
}

export type Command = CreateUser | CancelSubscribe

export type Query = CheckUsername

export type Subscribe = SubscribeUsers

export type Call = Command | Query | Subscribe

export let calls = [
  {
    CallType: 'Command',
    Type: 'CreateUser',
    In: '{ username: string }',
    Out:
      '{ Success: true } | { Success: false, Reason: "username already used" }',
    Replay: true,
    Async: false,
  },
  {
    CallType: 'Query',
    Type: 'CheckUsername',
    In: '{ username: string }',
    Out: '{ Success: true } & { used: boolean }',
    Replay: false,
    Async: false,
  },
  {
    CallType: 'Subscribe',
    Type: 'SubscribeUsers',
    In: '{}',
    Out: '{ Success: true } & { feed_id: string }',
    Feed: '{ username: string }',
    Replay: false,
    Async: false,
  },
  {
    CallType: 'Command',
    Type: 'CancelSubscribe',
    In: '{ feed_id: string }',
    Out: '{ Success: true }',
    Replay: false,
    Async: false,
  },
]

export type CallMeta = typeof calls[number]
