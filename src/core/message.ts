import { is, or, validate } from 'ts-class-validator';
import { nonEmptyField, requireField } from '../validate';

export class Message<T extends string = string> {
  @validate(requireField('id'), nonEmptyField('id'))
  id: string;

  @validate(requireField('type'), nonEmptyField('type'))
  type: T;

  @validate(or(is.empty(), is.int()))
  timestamp?: number;
}
