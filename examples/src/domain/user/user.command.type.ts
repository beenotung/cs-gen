import { ensureCommandType, CommonCommandResult } from 'cqrs-exp';
import { UserEvent } from './user.event.type';

export type UserCommand = (
  | {
  type: 'CreateUser';
  command: { username: string };
}
  | {
  type: 'ChangeUsername';
  command: { user_id: string; username: string };
}) & { result: CommonCommandResult, events: UserEvent[] };

ensureCommandType<UserCommand, UserEvent>();
