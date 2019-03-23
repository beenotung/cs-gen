import { nonEmptyField, requireField } from '../validate';
import { is, or, validate } from 'ts-class-validator';

export class Message<T extends string = string> {
  @validate(requireField('id'), nonEmptyField('id'))
  id: string;

  @validate(requireField('type'), nonEmptyField('type'))
  type: T;

  @validate(or(is.empty(), is.int()))
  timestamp?: number;
}
