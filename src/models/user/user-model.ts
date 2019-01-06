import { appStore } from '../../config/values';
import { BaseModel } from '../../lib/cqrs/impl/base-model';
import { command_handler } from '../../lib/cqrs/types';
import { injectCommandHandler, UserCommand } from './user-command';
import { injectEventHandler, UserEvent } from './user-event';
import { injectQueryHandler, UserQuery, UserQueryHandler, UserResponse } from './user-query';

export interface User {
  id: string
  username: string
}

export const UserType = 'User';

export interface UserData {
  type: 'User',
  data: User
}

export class UserModel extends BaseModel<UserCommand,
  UserEvent,
  UserQuery,
  UserResponse,
  command_handler<UserCommand, UserEvent>,
  UserQueryHandler> {
  users: User[];

  constructor() {
    super(new Promise((resolve, reject) => {
      setTimeout(() => {
        appStore.getByType(UserType)
          .then(xs => {
            console.log('restored users:', xs.length);
            this.users = xs;
          })
          .catch(() => {
            console.log('failed to restore user');
          })
          .then(() => resolve());
      });
    }));
    this.modelName = 'UserModel';
    injectCommandHandler(this);
    injectEventHandler(this);
    injectQueryHandler(this);
  }

  addUser(user: User) {
    this.users.push(user);
    return appStore.store({ id: user.id, type: UserType, data: user });
  }
}

export let userModel = new UserModel();
