import { USER_LIST } from './user.constants';
import 'cqrs-exp';
import { pos_int, timestamp, ensureEventType } from 'cqrs-exp';

export type UserListEvent = ({
  type: 'UserCreated',
  data: { user_id: string },
}) & {
  aggregate_id: USER_LIST,
  version: pos_int,
  timestamp: timestamp,
};
ensureEventType<UserListEvent>();
