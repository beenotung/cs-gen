import 'cqrs-exp';
import { ensureCommandType } from 'cqrs-exp';
import { UserEvent } from '../user1/user.event.type';

export type UserCommand = {};
ensureCommandType<UserCommand, UserEvent>();
