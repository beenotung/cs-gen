import { checkCallType } from 'cqrs-exp';

export type GetProfile = {
  Type: 'GetProfile',
  In: { UserId: string },
  Out: { UserId: string, UserName: string },
};
export type GetUserList = {
  Type: 'GetUserList',
  In: void,
  Out: Array<{ UserId: string, UserName: string }>,
};

export type Query = GetProfile | GetUserList;

export type CreateUser = {
  Type: 'CreateUser',
  In: { UserId: string, UserName: string },
  Out: ({ Success: true } | { Success: false; Reason: string }),
};
export type RenameUser = {
  Type: 'RenameUser',
  In: { UserId: string, NewUsername: string },
  Out: ({ Success: true } | { Success: false; Reason: string }),
};

export type Command = CreateUser | RenameUser;

export type Call = Query | Command;

checkCallType({} as Call);
