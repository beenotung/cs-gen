import 'cqrs-exp';
import { ensureQueryType, IEventStore, pos_int } from 'cqrs-exp';
import { UserEvent } from './user.event.type';
import { CommonReadModel } from './common-read-model';
import { USER_LIST } from './user.constants';
import { UserListEvent } from './user-list.event.type';

export interface UserList {
  /**
   * username -> user_id
   * */
  usernameToUserId: Map<string, string>;

  /**
   * user_id -> username
   * */
  userIdToUsername: Map<string, string>;
}

export type UserListQuery = ({
  type: 'FindUserIdByUsername';
  query: { username: string };
  response: 'not_found' | { user_id: string };
}) & {
  session_id: string;
  seq: pos_int;
};
ensureQueryType<UserListQuery>();

export class UserListReadModel extends CommonReadModel<UserList,
  UserEvent,
  UserListQuery,
  'userlist'> {
  aggregate_type: 'userlist' = 'userlist';
  queryTypes: UserListQuery['type'][] = ['FindUserIdByUsername'];
  /**
   * username -> user_id
   * */
  state: UserList;
  timestamp: pos_int;

  /**
   * user_id -> username
   * */

  constructor(public eventStore: IEventStore<UserListEvent>) {
    super();
    this.state = {
      usernameToUserId: new Map(),
      userIdToUsername: new Map(),
    };
    this.timestamp = 0;
    // FIXME merge the selector to ensure ordering
    this.eventStore.subscribeEventsFor(USER_LIST, events => events.forEach(userListEvent => {
      switch (userListEvent.type) {
        case 'UserCreated': {
          this.eventStore.subscribeEventsFor(userListEvent.data.user_id, events => events.forEach(userEvent => {

          }));
          userListEvent.data.user_id;
        }
      }
    }));
    this.eventStore.subscribeEventsBy({ type: 'UserCreated' as UserEvent['type'] }, events =>
      this.handleEvents(events),
    );
    this.eventStore.subscribeEventsBy<UserEvent,
      UserEvent['data'],
      UserEvent['type']>({ type: 'UsernameChanged' as UserEvent['type'] }, events =>
      this.handleEvents(events),
    );
  }

  createUser(user_id: string, username: string) {
    this.state.usernameToUserId.set(username, user_id);
    this.state.userIdToUsername.set(user_id, username);
  }

  rename(user_id: string, newUsername: string) {
    let oldUsername = this.state.userIdToUsername.get(user_id);
    this.state.usernameToUserId.delete(oldUsername);
    this.state.userIdToUsername.set(user_id, newUsername);
  }

  customHandleEvents(events: UserEvent[]): Promise<void> {
    events.forEach(event => {
      if (event.timestamp < this.timestamp) {
        // FIXME merge the selector to ensure ordering
        // return ;
      }
      switch (event.type) {
        case 'UserCreated':
          this.createUser(event.data.user_id, event.data.username);
          break;
        case 'UsernameChanged':
          this.rename(event.data.user_id, event.data.username);
          break;
        default:
          console.warn('unknown event of type:' + event!.type);
          return;
      }
      this.timestamp = event.timestamp;
    });
    return Promise.resolve();
  }

  handleQuery(query: UserListQuery): Promise<UserListQuery> {
    switch (query.type) {
      case 'FindUserIdByUsername':
        let user_id = this.state.usernameToUserId.get(query.query.username);
        query.response = { user_id };
        break;
      default:
        return Promise.reject('unknown query of type:' + query.type);
    }
    return Promise.resolve(query);
  }
}
