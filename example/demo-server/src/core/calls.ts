import { Call } from '../domain/types';

export type CallMeta = {
  CallType: Call['CallType'],
  Type: Call['Type'],
  In: string,
  Out: string,
} & {
  Admin?: boolean;
  Internal?: boolean;
  OptionalAuth?: boolean;
  RequiredAuth?: boolean;
};

export const calls: CallMeta[] = [
  {
    CallType: `Command`,
    Type: `CreateUser`,
    In: `{ UserId: string, UserName: string }`,
    Out: `({ Success: true } | { Success: false; Reason: string })`,
  },
  {
    CallType: `Command`,
    Type: `RenameUser`,
    In: `{ UserId: string, NewUsername: string }`,
    Out: `({ Success: true } | { Success: false; Reason: string })`,
  },
  {
    CallType: `Command`,
    Type: `CreateItem`,
    In: `{ ItemName: string, UserId: string }`,
    Out: `({ Success: true } | { Success: false; Reason: string })`,
  },
  {
    CallType: `Command`,
    Type: `BlockUser`,
    In: `{ UserId: string }`,
    Out: `({ Success: true } | { Success: false; Reason: string })`,
    Admin: true,
  },
  {
    CallType: `Query`,
    Type: `GetProfile`,
    In: `{ UserId: string }`,
    Out: `{ UserId: string, UserName: string }`,
  },
  {
    CallType: `Query`,
    Type: `GetUserList`,
    In: `void`,
    Out: `Array<{ UserId: string, UserName: string }>`,
  },
  {
    CallType: `Subscribe`,
    Type: `SubscribeItems`,
    In: `void`,
    Out: `{ id: string }`,
  }
];

export function isInternalCall(Type: Call['Type']): boolean {
  const call = calls.find(call => call.Type === Type)
  if (!call) {
    return false
  }
  return !!call.Internal
}
