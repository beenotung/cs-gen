import { Call } from '../domain/types'

export type CallMeta = {
  CallType: Call['CallType']
  Type: Call['Type']
  In: string
  Out: string
} & {
  Admin?: boolean
  Internal?: boolean
  OptionalAuth?: boolean
  RequiredAuth?: boolean
  Replay?: boolean
}

// tslint:disable max-line-length
export const calls: CallMeta[] = [
  {
    CallType: `Command`,
    Type: `CancelSubscribe`,
    In: `{ id: string }`,
    Out: `{ Success: false, Reason: "no active session matched" | "no active channel matched" } | { Success: true }`,
    Replay: true,
  },
  {
    CallType: `Command`,
    Type: `SetKV`,
    In: `{ Key: string, Value: string }`,
    Out: `{ Success: false, Reason: never } | { Success: true }`,
    Replay: true,
  },
  {
    CallType: `Command`,
    Type: `DeleteByKey`,
    In: `({ Key: string }) & { AdminPassword: string }`,
    Out: `({ Success: false, Reason: "KeyNotFound" } | { Success: true }) | { Success: false, Reason: 'Wrong Admin Password' }`,
    Admin: true,
    Replay: true,
  },
  {
    CallType: `Query`,
    Type: `GetValue`,
    In: `{ Key: string }`,
    Out: `{ Success: false, Reason: "KeyNotFound" } | ({ Success: true } & { Value: string })`,
  },
  {
    CallType: `Query`,
    Type: `ListKeys`,
    In: `(void) & { AdminPassword: string }`,
    Out: `({ Success: false, Reason: "KeyNotFound" } | ({ Success: true } & { Keys: string[] })) | { Success: false, Reason: 'Wrong Admin Password' }`,
    Admin: true,
  },
  {
    CallType: `Subscribe`,
    Type: `SubscribeByKey`,
    In: `{ Key: string }`,
    Out: `{ Value: string }`,
  },
]
// tslint:enable max-line-length

export const callMap = new Map<Call['Type'], CallMeta>(
  calls.map(call => [call.Type, call]),
)

export function isInternalCall(Type: Call['Type']): boolean {
  const call = callMap.get(Type)
  if (!call) {
    return false
  }
  return !!call.Internal
}

export function shouldReplay(Type: Call['Type']): boolean {
  return !!callMap.get(Type)?.Replay
}
