import { id } from '../lib/cqrs/types/data.types';

export enum UserCmdType {
  CreateUser = 'CreateUser',
}

export interface CreateUser {
  id: id;
  username: string;
}

export type UserCmd = CreateUser;
