import { validate } from 'ts-class-validator';
import { requireField } from '../validate';
import { Message } from './message';

export class Command<T extends string = string, C = any> extends Message<T> {
  @validate(requireField('command'))
  command: C;
}
