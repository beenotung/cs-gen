import { ensureQueryType, IEventStore, JsonValue, pos_int } from 'cqrs-exp';
import { UserEvent } from './user.event.type';
import { CommonReadModel } from '../common-read-model';
import { config } from '../../config/values';
import eventStore = config.eventStore;

export interface User {
  user_id: string;
  username: string;
}

export type UserQuery = ({
  type: 'GetUser';
  query: { user_id: string };
  response: 'not_found' | { user: User & JsonValue };
}) & {
  session_id: string;
  seq: pos_int;
};
ensureQueryType<UserQuery>();

export class UserReadModel extends CommonReadModel<UserEvent, UserQuery> {
  timestamp: number = 0;

  constructor() {
    super();
  }

  handleEvent(events: UserEvent[]): void | Promise<void> {
    throw new Error('Method not implemented.');
  }

  query(
    query: UserQuery,
  ): Promise<
    | 'not_found'
    | {
        user:
          | (User & string)
          | (User & number)
          | (User &
              import('C:/Users/USER/workspace/gitlab.com/beenotung/cqrs-exp/dist/index').JsonArray)
          | (User &
              import('C:/Users/USER/workspace/gitlab.com/beenotung/cqrs-exp/dist/index').JsonObject);
      }
  > {
    throw new Error('Method not implemented.');
  }
}

export class UserReadModel1 extends CommonReadModel<UserEvent, UserQuery> {
  aggregate_type: 'user' = 'user';
  queryTypes: UserQuery['type'][] = ['GetUser'];
  state: User;
  timestamp: pos_int;

  constructor(public eventStore: IEventStore<UserEvent>) {
    super();
    this.state = null;
    this.timestamp = null;
  }

  customHandleEvents(events: UserEvent[]): Promise<void> {
    events.forEach(event => {
      if (event.timestamp < this.timestamp) {
        // FIXME merge the selector to ensure ordering
        // return ;
      }
      switch (event.type) {
        case 'UserCreated':
          this.state = {
            user_id: event.data.user_id,
            username: event.data.username,
          };
          break;
        case 'UsernameChanged':
          // FIXME how to define aggregate root for this case?
          if (this.state.user_id === event.data.user_id) {
            this.state.username = event.data.username;
          }
          break;
        default:
          console.warn('unknown event of type:' + event!.type);
          return;
      }
      this.timestamp = event.timestamp;
    });
    return Promise.resolve();
  }

  handleQuery(query: UserQuery): Promise<UserQuery> {
    switch (query.type) {
      case 'GetUser':
        query.response = { user: this.state as JsonValue & User };
        break;
      default:
        return Promise.reject('unknown query of type:' + query.type);
    }
    return Promise.resolve(query);
  }
}
