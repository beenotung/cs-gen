import { ensureQueryType, IEvent, IModel, pos_int } from 'cqrs-exp';
import { UserEvent } from './user.event.type';
import * as util from 'util';

export interface User {
  user_id: string
  username: string
}


export type UserQuery = ({
  type: 'FindUserByUsername',
  query: { username: string },
  response: 'not_found' | User
}) & {
  session_id: string
  seq: pos_int
};
ensureQueryType<UserQuery>();


export class UserModel implements IModel<User, UserEvent['data'], UserEvent['type'], 'user'> {
  aggregate_type: 'user';
  eventTypes: UserEvent['type'][] = [
    'UserCreated',
    'UsernameChanged',
  ];

  init(): User {
    return undefined as any;
  }

  reduce(events: Array<IEvent<UserEvent['data'], UserEvent['type']>>, init: User): User {
    return events.reduce((acc, c) => {
      switch (c.type as UserEvent['type']) {
        case 'UserCreated':
          return {
            user_id: c.data.user_id,
            username: c.data.username,
          };
        case 'UsernameChanged':
          return {
            ...init,
            username: c.data.username,
          };
        default:
          throw new Error('unknown event:' + util.format(c));
      }
    }, init);
  }
}
