import { id } from './types';

export type Consumer<A> = (a: A) => void;
export type Mapper<A, B> = (a: A) => B;

export function idToString(id: id): string {
  return id.toString();
}
