import { store } from '../../config/values';
import { CqrsEngine } from '../../lib/cqrs/cqrs-engine';
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

  constructor(public cqrsEngine: CqrsEngine<UserCommand,
    UserEvent,
    UserQuery,
    UserResponse,
    command_handler<UserCommand, UserEvent>,
    UserQueryHandler>) {
    super('UserModel', cqrsEngine);
    this.users = [];
    injectCommandHandler(this);
    injectEventHandler(this);
    injectQueryHandler(this);
  }

  addUser(user: User) {
    this.users.push(user);
    return store.store({ id: user.id, type: UserType, data: user });
  }
}

