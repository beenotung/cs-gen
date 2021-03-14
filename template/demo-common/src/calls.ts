export type CreateUser = {
  CallType: "Command"
  Type: "CreateUser"
  In: { username: string }
  Out: { Success: true } | { Success: false, Reason: "username already used" }
  Replay: true
}

export type CheckUsername = {
  CallType: "Query"
  Type: "CheckUsername"
  In: { username: string }
  Out: { used: boolean }
  Replay: false
}

export type SubscribeUsers = {
  CallType: "Subscribe"
  Type: "SubscribeUsers"
  In: {}
  Out: { username: string }
  Replay: false
}

export type Command = CreateUser

export type Query = CheckUsername

export type Subscribe = SubscribeUsers

export type Call = Command | Query | Subscribe

export let calls = [
  {
    "CallType": "Command",
    "Type": "CreateUser",
    "In": "{ username: string }",
    "Out": "{ Success: true } | { Success: false, Reason: \"username already used\" }",
    "Replay": true
  },
  {
    "CallType": "Query",
    "Type": "CheckUsername",
    "In": "{ username: string }",
    "Out": "{ used: boolean }",
    "Replay": false
  },
  {
    "CallType": "Subscribe",
    "Type": "SubscribeUsers",
    "In": "{}",
    "Out": "{ username: string }",
    "Replay": false
  }
]

export type CallMeta = (typeof calls)[number]
