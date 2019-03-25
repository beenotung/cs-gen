import { validate } from 'ts-class-validator';
import { requireField } from '../validate';
import { Message } from './message';

export class DomainEvent<T extends string = string, E = any> extends Message<
  T
> {
  @validate(requireField('event'))
  event: E;
}
