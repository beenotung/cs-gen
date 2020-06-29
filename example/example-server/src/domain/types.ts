export type CancelSubscribe = {
  CallType: 'Command'
  Type: 'CancelSubscribe'
  In: { id: string; Timestamp: number }
  Out:
    | {
        Success: false
        Reason: 'no active session matched' | 'no active channel matched'
      }
    | { Success: true }
}
export type SetKV = {
  CallType: 'Command'
  Type: 'SetKV'
  In: { Key: string; Value: string; Timestamp: number }
  Out: { Success: false; Reason: never } | { Success: true }
}
export type DeleteByKey = {
  CallType: 'Command'
  Type: 'DeleteByKey'
  In: ({ Key: string } & { AdminPassword: string }) & { Timestamp: number }
  Out:
    | ({ Success: false; Reason: 'KeyNotFound' } | { Success: true })
    | { Success: false; Reason: 'Wrong Admin Password' }
}

export type Command = CancelSubscribe | SetKV | DeleteByKey

export type GetValue = {
  CallType: 'Query'
  Type: 'GetValue'
  In: { Key: string; Timestamp: number }
  Out:
    | { Success: false; Reason: 'KeyNotFound' }
    | ({ Success: true } & { Value: string })
}
export type ListKeys = {
  CallType: 'Query'
  Type: 'ListKeys'
  In: (void & { AdminPassword: string }) & { Timestamp: number }
  Out:
    | (
        | { Success: false; Reason: 'KeyNotFound' }
        | ({ Success: true } & { Keys: string[] })
      )
    | { Success: false; Reason: 'Wrong Admin Password' }
}

export type Query = GetValue | ListKeys

export type SubscribeByKey = {
  CallType: 'Subscribe'
  Type: 'SubscribeByKey'
  In: { Key: string; Timestamp: number }
  Out: { Value: string }
}

export type Subscribe = SubscribeByKey

export type Call = Command | Query | Subscribe

export interface CallInput<C extends Call = Call> {
  CallType: C['CallType']
  Type: C['Type']
  In: C['In']
}

function checkCallType(_t: {
  CallType: 'Command' | 'Query' | 'Subscribe'
  Type: string
  In: any
  Out: any
}) {
  /* static type check only */
}

checkCallType({} as Call)

export const app_id: 'com.example.example' = 'com.example.example'
