import { ensureEventType, pos_int, timestamp } from 'cqrs-exp';

export type UserEvent = ({
  type: 'UserCreated'
  data: {
    user_id: string
    username: string
  }
} | {
  type: 'UsernameChanged'
  data: {
    user_id: string
    username: string
  }
}) & {
  aggregate_id: string
  version: pos_int
  timestamp: timestamp
};

ensureEventType<UserEvent>();
