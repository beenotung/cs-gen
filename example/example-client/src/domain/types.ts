export type CancelSubscribe = {
  CallType: 'Command'
  Type: 'CancelSubscribe'
  In: { id: string }
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
  In: { Key: string; Value: string }
  Out: { Success: false; Reason: never } | { Success: true }
}

export type Command = CancelSubscribe | SetKV

export type GetValue = {
  CallType: 'Query'
  Type: 'GetValue'
  In: { Key: string }
  Out:
    | { Success: false; Reason: 'KeyNotFound' }
    | ({ Success: true } & { Value: string })
}

export type Query = GetValue

export type SubscribeByKey = {
  CallType: 'Subscribe'
  Type: 'SubscribeByKey'
  In: { Key: string }
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
