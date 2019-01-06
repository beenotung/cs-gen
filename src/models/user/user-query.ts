import { query_handler } from '../../lib/cqrs/types';
import { UserModel } from './user-model';

export interface FindUserByUsername {
  type: 'FindUserByUsername',
  data: { username: string }
}

export interface FindUserById {
  type: 'FindUserById',
  data: { username: string }
}

export type UserQuery = FindUserByUsername | FindUserById;

export type UserResponse = UserModel;

export type UserQueryHandler =
  query_handler<FindUserByUsername, UserModel>
  | query_handler<FindUserById, UserModel>;
