import { Service, User } from './domain-read-model';
import { IQuery } from '../core/data-types';
import { JsonValue } from '../core/util-types';

export type ListUser = IQuery<never, User[] & JsonValue, 'ListUser'>
export type ListService = IQuery<never, Service[] & JsonValue, 'ListService'>

export type DomainQuery = ListUser | ListService;
