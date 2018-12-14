export enum UserEvents {
  UserCreated = 'UserCreated',
}

export interface UserCreated {
  user_id: string
  username: string
}

export interface PhoneUpdated {
  user_id: string
  phone: string
}
