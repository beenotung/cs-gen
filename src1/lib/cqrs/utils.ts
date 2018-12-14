import { Consumer } from './types/api.types';
import {
  ConcreteTypeSelector,
  GeneralTypeSelector,
  id,
} from './types/data.types';

export function idToString(id: id): string {
  switch (typeof id) {
    case 'string':
      return id;
    case 'number':
    default:
      return id.toString();
  }
}

export function mkId(type: string, versionOrId: id): string {
  return type + '_v' + versionOrId.toString;
}

export function map_push<K, V>(map: Map<K, V[]>, k: K, v: V) {
  if (map.has(k)) {
    map.get(k).push(v);
  } else {
    map.set(k, [v]);
  }
}

export function map_getAll<K, V>(map: Map<K, V[]>, k: K): V[] {
  if (map.has(k)) {
    return map.get(k);
  } else {
    return [];
  }
}

export function foreachType(types: GeneralTypeSelector, f: Consumer<string>) {
  if (Array.isArray(types)) {
    types.forEach(f);
  } else {
    f(types);
  }
}

export function toConcreteTypeSelector(type: string): ConcreteTypeSelector {
  switch (type) {
    case 'all':
      return type;
    case 'else':
      throw new TypeError("expect concrete type selector, got 'else' selector");
    default:
      return [type];
  }
}

export function mkMap<K, V>(k: K, v: V): Map<K, V> {
  const res = new Map();
  res.set(k, v);
  return res;
}

export function mapTypes<A>(
  types: GeneralTypeSelector,
  f: (type: string) => A,
): A[] {
  if (Array.isArray(types)) {
    return types.map(f);
  } else {
    return [f(types)];
  }
}

/**
 * only for serializable objects
 * */
export function json_object_equal(a, b): boolean {
  if (a === b) {
    return true;
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) {
      return false;
    }
    if (a.length !== b.length) {
      return false;
    }
    for (const i in a) {
      if (!json_object_equal(a[i], b[i])) {
        return false;
      }
    }
    /* all elements in two arrays are the same */
    return true;
  }
  /* json object */
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  for (const k of aKeys) {
    if (!json_object_equal(a[k], b[k])) {
      return false;
    }
  }
  return true;
}
