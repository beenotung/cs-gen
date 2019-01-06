export enum UserQueryInputType {
  GetUserByUsername = 'GetUserByUsername',
  GetUserById = 'GetUserById',
}

export interface GetUserByUsername {
  username: string;
}

export interface GetUserById {
  user_id: string;
}
