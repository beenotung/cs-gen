export interface CreateUser {
  type: 'CreateUser'
  data: {
    id: string
    username: string,
  }
}

export interface UpdateUserName {
  type: 'UpdateUserName'
  data: {
    id: string
    username: string,
  }
}

export type UserCommand = CreateUser | UpdateUserName;
