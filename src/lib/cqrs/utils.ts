import { getObjectType } from '@beenotung/tslib';
import { id } from './types';

export type Consumer<A> = (a: A) => void;
export type Mapper<A, B> = (a: A) => B;

export function idToString(id: id): string {
  return id.toString();
}

function as<T>(x): T {
  return x;
}

export function partialMatch<T>(query: Partial<T>, target: T): boolean {
  const queryType = getObjectType(query);
  const targetType = getObjectType(target);
  if (queryType !== targetType) {
    return false;
  }
  switch (queryType) {
    case 'AsyncFunction':
    case 'Function':
      throw new Error('unsupported partial match on type: ' + queryType);
    case 'Number':
    case 'Null':
    case 'Undefined':
    case 'String':
      return query === target;
    case 'Array':
      return as<any[]>(target).some(t => as<any[]>(query).indexOf(t) !== -1);
    case 'Set':
      return partialMatch(
        Array.from(as<Set<any>>(query)),
        Array.from(as<Set<any>>(target)),
      );
    case 'Map': {
      let matched = false;
      const targetMap = as<Map<any, any>>(target);
      as<Map<any, any>>(query).forEach((v, k) => {
        matched = matched || partialMatch(v, targetMap.get(k));
      });
      return matched;
    }
    case 'Object':
      return Object.keys(query).some(key => partialMatch(query[key], target[key]));
  }
}
