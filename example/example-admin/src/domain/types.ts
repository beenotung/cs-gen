export type DeleteByKey = {
  CallType: 'Command'
  Type: 'DeleteByKey'
  In: { Key: string } & { AdminPassword: string }
  Out:
    | ({ Success: false; Reason: 'KeyNotFound' } | { Success: true })
    | { Success: false; Reason: 'Wrong Admin Password' }
}

export type Command = DeleteByKey

export type ListKeys = {
  CallType: 'Query'
  Type: 'ListKeys'
  In: void & { AdminPassword: string }
  Out:
    | (
        | { Success: false; Reason: 'KeyNotFound' }
        | ({ Success: true } & { Keys: string[] })
      )
    | { Success: false; Reason: 'Wrong Admin Password' }
}

export type Query = ListKeys

export type Subscribe = never

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
