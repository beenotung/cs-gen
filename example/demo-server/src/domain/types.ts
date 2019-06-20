import { checkCallType } from 'cqrs-exp';

export type CreateUser = {
  CallType: 'Command';
  Type: 'CreateUser',
  In: { UserId: string, UserName: string },
  Out: ({ Success: true } | { Success: false; Reason: string }),
};
export type RenameUser = {
  CallType: 'Command';
  Type: 'RenameUser',
  In: { UserId: string, NewUsername: string },
  Out: ({ Success: true } | { Success: false; Reason: string }),
};
export type CreateItem = {
  CallType: 'Command';
  Type: 'CreateItem',
  In: { ItemName: string, UserId: string },
  Out: ({ Success: true } | { Success: false; Reason: string }),
};

export type Command = CreateUser | RenameUser | CreateItem;

export type GetProfile = {
  CallType: 'Query';
  Type: 'GetProfile',
  In: { UserId: string },
  Out: { UserId: string, UserName: string },
};
export type GetUserList = {
  CallType: 'Query';
  Type: 'GetUserList',
  In: void,
  Out: Array<{ UserId: string, UserName: string }>,
};

export type Query = GetProfile | GetUserList;

export type SubscribeItems = {
  CallType: 'Subscribe';
  Type: 'SubscribeItems',
  In: void,
  Out: { id: string },
};

export type Subscribe = SubscribeItems;

export type Call = Command | Query | Subscribe;

checkCallType({} as Call);
