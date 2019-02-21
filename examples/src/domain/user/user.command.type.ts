import { ensureCommandType, CommonCommandResult } from 'cqrs-exp';

export type UserCommand = (
  | {
      type: 'CreateUser';
      command: { username: string };
    }
  | {
      type: 'ChangeUsername';
      command: { user_id: string; username: string };
    }) & { result: CommonCommandResult };

ensureCommandType<UserCommand>();
