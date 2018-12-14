import { enum_keys } from '@beenotung/tslib/enum';
import { id } from '../lib/cqrs/types/data.types';

export enum UserEventType {
  UserCreated = 'UserCreated',
}

export const UserEventTypes = enum_keys(UserEventType);

export interface UserCreated {
  id: id;
  username: string;
}

export type UserEvent = UserCreated;
