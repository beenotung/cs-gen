import { BaseModel } from '../../lib/cqrs/impl/base-model';
import { command_handler } from '../../lib/cqrs/types';
import { UserCommand } from './user-command';
import { UserEvent } from './user-event';
import { UserQuery, UserQueryHandler, UserResponse } from './user-query';

export interface UserModel {
  id: string
  username: string
}

export class UserModel extends BaseModel<UserCommand,
  UserEvent,
  UserQuery,
  UserResponse,
  command_handler<UserCommand, UserEvent>,
  UserQueryHandler> {
}
