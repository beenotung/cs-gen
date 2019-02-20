import 'cqrs-exp';
import { ensureQueryType, IEvent, IModel, pos_int } from 'cqrs-exp';
import { UserEvent } from './user.event.type';
import * as util from 'util';

export interface UserList {
  /**
   * username -> user_id
   * */
  usernameMap: Map<string, string>
}

export type UserListQuery = ({
  type: 'FindUserIdByUsername'
  query: { username: string }
  response: 'not_found' | { user_id: string }
}) & {
  session_id: string
  seq: pos_int
};
ensureQueryType<UserListQuery>();

export class UserListModel implements IModel<UserList, UserEvent['data'], UserEvent['type'], 'user_list'> {
  aggregate_type: 'user_list';
  eventTypes: UserEvent['type'][] = [
    'UserCreated',
    'UsernameChanged',
  ];

  init(): UserList {
    return {
      usernameMap: new Map(),
    };
  }

  reduce(events: Array<IEvent<UserEvent['data'], UserEvent['type']>>, init: UserList): UserList {
    return events.reduce((acc, c) => {
      switch (c.type) {
        case 'UserCreated':
          acc.usernameMap.set(c.data.username, c.data.user_id);
          return acc;
        case 'UsernameChanged':
          acc.usernameMap.delete(c.data.username);
          acc.usernameMap.set(c.data.username, c.data.user_id);
          return acc;
        default:
          throw new Error('unexpected event:' + util.format(c));
      }
    }, init);
  }
}
