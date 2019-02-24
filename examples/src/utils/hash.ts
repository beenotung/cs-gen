import 'cqrs-exp';
import { JsonValue } from 'cqrs-exp';
import * as multihashes from 'typestub-multihashes';
import * as multibase from 'typestub-multibase';

export function hashObject<T extends JsonValue>(
  o: T,
  excludeField?: keyof T,
): string {
  let sortedObject = {} as T;
  let keys = Object.keys(o).sort();
  if (arguments.length > 1) {
    keys.forEach(key => {
      if (key !== excludeField) {
        sortedObject[key] = o[key];
      }
    });
  } else {
    keys.forEach(key => (sortedObject[key] = o[key]));
  }
  let text = JSON.stringify(sortedObject);
  let digest = multihashes.encode(new Buffer(text), 'sha2-256');
  let encoded = multibase.encode('base58btc', digest);
  return encoded.toString();
}
