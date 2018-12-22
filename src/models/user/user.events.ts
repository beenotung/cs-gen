export enum UserEvents {
  UserCreated = 'UserCreated',
  UserPhoneUpdated = 'UserPhoneUpdated',
}

export interface UserCreated {
  user_id: string;
  username: string;
}

export interface UserPhoneUpdated {
  user_id: string;
  phone: string;
}
