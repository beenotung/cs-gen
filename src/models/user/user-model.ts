import { BaseModel } from '../../lib/cqrs/impl/base-model';
import { command_handler } from '../../lib/cqrs/types';
import { injectCommandHandler, UserCommand } from './user-command';
import { injectEventHandler, UserEvent } from './user-event';
import { injectQueryHandler, UserQuery, UserQueryHandler, UserResponse } from './user-query';

export interface User {
  id: string
  username: string
}

export class UserModel extends BaseModel<UserCommand,
  UserEvent,
  UserQuery,
  UserResponse,
  command_handler<UserCommand, UserEvent>,
  UserQueryHandler> {
  users: User[];

  constructor() {
    super();
    this.modelName = 'UserModel';
    this.users = [];
    injectCommandHandler(this);
    injectEventHandler(this);
    injectQueryHandler(this);
  }
}

export let userModel = new UserModel();
