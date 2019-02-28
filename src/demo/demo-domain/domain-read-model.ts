import { ReadModel } from '../core/read-model';
import { EventStore } from '../core/event-store';
import { DomainEvent, ServiceRegistered, UserRegistered } from './domain-event';
import { DomainQuery, ListService, ListUser } from './domain-query';
import { HashedArray } from '@beenotung/tslib/hashed-array';
import { ensureJsonValue } from '../utils/json';

export interface User {
  user_id: string
  nickname: string
  services: Service[]
}

export interface Service {
  service_id: string
  provider: User
  name: string
  desc: string
}

export class DomainReadModel extends ReadModel<DomainEvent, DomainQuery> {
  users = new HashedArray<User>(x => x.user_id);
  services = new HashedArray<Service>(x => x.service_id);

  constructor(public eventStore: EventStore<DomainEvent['type']>) {
    super(eventStore);
    this.when('UserRegistered', this.userRegistered);
    this.when('ServiceRegistered', this.serviceRegistered);
    this.provide('ListUser', this.listUser);
    this.provide('ListService', this.listService);
  }

  /**
   * event handlers
   * */

  userRegistered(event: UserRegistered) {
    this.users.insert({
      user_id: event.event.user_id,
      nickname: event.event.nickname,
      services: [],
    });
  }

  serviceRegistered(event: ServiceRegistered) {
    this.services.insert({
      service_id: event.event.service_id,
      provider: this.users.get(event.event.provider_user_id),
      name: event.event.service_name,
      desc: event.event.service_desc,
    });
  }

  /**
   * query handlers
   * */

  listUser(query: ListUser) {
    return ensureJsonValue(this.users.array);
  }

  listService(query: ListService) {
    return ensureJsonValue(this.services.array);
  }
}
