import { event, id } from '../../lib/cqrs/types';
import { UserModel } from './user-model';

export type UserEventType =
  'UserCreated'
  | 'UserUpdated'
  ;

export interface UserCreated {
  id: id
  type: 'UserCreated'
  data: { id: string, username: string }
}

export interface UserUpdated {
  id: id,
  type: 'UserUpdated'
  data: { id: string, username: string }
}

export type UserEvent = UserCreated | UserUpdated;

export function injectEventHandler(model: UserModel) {
  [
    'UserCreated',
    'UserUpdated',
  ].forEach(type => model.addEventHandler(type, async event => {
    switch (event.type) {
      case 'UserCreated':
        if (model.users.find(u => u.id === event.data.id)) {
          return;
        }
        await model.addUser({
          id: event.data.id,
          username: event.data.username,
        });
        console.log('now have ' + model.users.length + ' users');
        break;
      case 'UserUpdated':
        model.users.find(u => u.id === event.data.id).username = event.data.username;
        break;
      default:
        console.warn('not implemented event handler of type: ' + (event as event).type);
    }
  }));
}
