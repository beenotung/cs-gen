import { ICommand } from '../core/data-types';

export interface RegisterUser extends ICommand {
  type: 'RegisterUser'
  command: {
    user_id: string
    nickname: string,
  }
}

export interface RegisterService extends ICommand {
  type: 'RegisterService'
  command: {
    user_id: string
    service_id: string
    service_name: string
    service_desc: string,
  }
}

export type DomainCommand = RegisterUser | RegisterService;
