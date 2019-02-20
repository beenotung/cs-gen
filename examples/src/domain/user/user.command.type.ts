import { ensureCommandType } from 'cqrs-exp';

export type UserCommand = {
  type: 'CreateUser',
  data: { username: string }
} | {
  type: 'ChangeUsername',
  data: { user_id: string, username: string }
};

ensureCommandType<UserCommand>();

