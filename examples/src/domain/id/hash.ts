import { hash } from '@beenotung/tslib/hash';
import { encode } from 'typestub-multihashes';
import { Buffer } from 'safe-buffer';

export function hashObject(s: string | any): string {
  if (typeof s !== 'string') {
    s = JSON.stringify(s);
  }
  const h = hash(s, 'sha1');
  const b = typeof h === 'string' ? new Buffer(h) : h;
  return encode(b, 'sha1').toString();
}
