import { genId } from '../../lib/cqrs/utils';
import { UserModel } from './user-model';

export interface CreateUser {
  type: 'CreateUser'
  data: {
    id: string
    username: string,
  }
}

export interface UpdateUserName {
  type: 'UpdateUserName'
  data: {
    id: string
    username: string,
  }
}

export type UserCommand = CreateUser | UpdateUserName;

export function injectCommandHandler(model: UserModel) {
  model.addCommandHandler('CreateUser', x => [{
    id: genId(),
    type: 'UserCreated',
    data: {
      id: x.data.id,
      username: x.data.username,
    },
  }]);
  model.addCommandHandler('UpdateUserName', x => [{
    id: genId(),
    type: 'UserUpdated',
    data: {
      id: x.data.id,
      username: x.data.username,
    },
  }]);
}
