import { enum_keys } from '@beenotung/tslib';

export enum UserQueryType {
  GetUser = 'GetUser',
}

export const UserQueryTypes = enum_keys(UserQueryType);

export interface GetUser {
  username: string;
}

export type UserQuery = GetUser;
