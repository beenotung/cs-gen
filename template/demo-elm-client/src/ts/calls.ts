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
    CallType: 'Query',
    Type: 'GetAllUsernames',
    In: '{}',
    Out: '{ Success: true } & { usernames: Array<string> }',
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

export let apiConfig = { port: 3000 }
