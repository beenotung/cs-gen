import { prop } from 'typegoose';
import { SingleModelImpl } from '../lib/cqrs/impl/single-model';
import { Event, id } from '../lib/cqrs/types/data.types';

export class User {
  @prop({ required: true })
  id: id;

  @prop({ required: true })
  username: string;
}

export let userEventTypes: string[] = [];
userEventTypes.push('UserCreated ');

export interface UserCreated {
  id: id;
  username: string;
}

export type UserEvent = UserCreated;

export class UserModel extends SingleModelImpl<User, UserEvent> {
  eventTypes = userEventTypes;

  handleEvents(events: Array<Event<UserEvent>>): Promise<User>;
  handleEvents(events: Array<Event<UserEvent>>): Promise<User>;
  handleEvents(events: Array<Event<UserEvent>>): Promise<User> {
    return undefined;
  }
}
