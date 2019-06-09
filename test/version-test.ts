import { test } from 'tape';
import { decodeVersion } from '../src/utils/version';

test('version', t => {
  t.deepEqual(
    decodeVersion('1.2.3'),
    [1, 2, 3],
    'should decode numeric version',
  );
  t.throws(
    () => decodeVersion('1.2.3-doc'),
    TypeError,
    'should throw error on non-numeric version',
  );
  t.throws(
    () => decodeVersion(''),
    Error,
    'should throw error on empty string',
  );
  t.throws(
    () => decodeVersion('1.2.3.4'),
    Error,
    'should throw error on more than 3 version number',
  );
  t.end();
});
