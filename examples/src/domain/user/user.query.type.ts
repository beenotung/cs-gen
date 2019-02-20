import { HashedArray } from '@beenotung/tslib/hashed-array';
import { ensureQueryType, IEvent, IModel, pos_int } from 'cqrs-exp';
import { UserEvent } from './user.event.type';

export interface User {
  user_id: string
  username: string
}

export interface UserAggregates {
  users: HashedArray<User>
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


export class UserModel implements IModel<UserAggregates, UserEvent['data'], 'user'> {
  aggregate_type: 'user';

  reduce(events: Array<IEvent<UserEvent['data']>>, init: UserAggregates): UserAggregates {
    return events.reduce((acc, c) => {
      switch (c.type) {

      }
      return acc;
    }, init);
  }
}
