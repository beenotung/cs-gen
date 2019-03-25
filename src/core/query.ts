import { validate } from 'ts-class-validator';
import { requireField } from '../validate';
import { Message } from './message';

export class Query<T extends string = string, Q = any, R = any> extends Message<
  T
> {
  @validate(requireField('query'))
  query: Q;

  result?: R;
}
