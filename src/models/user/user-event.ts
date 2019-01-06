import { id } from '../../lib/cqrs/types';

export interface UserCreated {
  id: id
  type: 'UserCreated'
  data: { id: string, username: string }
}

export type UserEvent = UserCreated;
