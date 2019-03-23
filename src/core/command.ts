import { Message } from './message';
import { validate } from 'ts-class-validator';
import { requireField } from '../validate';

export class Command<T extends string = string, C = any> extends Message<T> {
  @validate(requireField('command'))
  command: C;
}
