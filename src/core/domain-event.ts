import { Message } from './message';
import { requireField } from '../validate';
import { validate } from 'ts-class-validator';

export class DomainEvent<T extends string = string, E = any> extends Message<
  T
> {
  @validate(requireField('event'))
  event: E;
}
