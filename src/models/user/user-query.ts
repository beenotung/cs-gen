import { query_handler } from '../../lib/cqrs/types';
import { User, UserModel } from './user-model';

export interface FindUserByUsername {
  type: 'FindUserByUsername',
  data: { username: string }
}

export interface FindUserById {
  type: 'FindUserById',
  data: { id: string }
}

export type UserQuery = FindUserByUsername | FindUserById;

export type UserResponse = User;

export type UserQueryHandler =
  query_handler<FindUserByUsername, User>
  | query_handler<FindUserById, User>;

export function injectQueryHandler(model: UserModel) {
  model.addQueryHandler('FindUserByUsername', x => model.users.find(u => u.username === x.data.username));
  model.addQueryHandler('FindUserById', q => {
    console.log('find user by id:', { q, us: model.users });
    return model.users.find(u => u.id === q.data.id);
  });
}
