import { IEvent } from '../core/data-types';

export interface UserRegistered extends IEvent {
  type: 'UserRegistered'
  event: {
    user_id: string
    nickname: string
  }
}

export interface ServiceRegistered extends IEvent {
  type: 'ServiceRegistered'
  event: {
    service_id: string
    provider_user_id: string
    service_name: string
    service_desc: string
  }
}

export type DomainEvent = UserRegistered | ServiceRegistered
