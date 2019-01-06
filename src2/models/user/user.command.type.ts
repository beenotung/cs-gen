export enum UserCommandType {
  CreateUser = 'CreateUser',
  SetUserPhone = 'SetUserPhone',
}

export interface CreateUser {
  user_id: string;
  username: string;
}

export interface SetUserPhone {
  user_id: string;
  phone: string;
}
