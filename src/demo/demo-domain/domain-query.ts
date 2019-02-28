import { IQuery } from '../../core/data';
import { Service, User } from './domain-read-model';

export type ListUser = IQuery<never, User[], 'ListUser'>
export type ListService = IQuery<never, Service[], 'ListService'>

export type DomainQuery = ListUser | ListService;
