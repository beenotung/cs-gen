import { Callback } from './types';

export function wrapCallbackFn<T>(fn: (cb: Callback<T>) => void) {
  function invokeCallbackFn(cb: Callback<T>): void;
  function invokeCallbackFn(): Promise<T>;
  function invokeCallbackFn(cb?: Callback<T>) {
    if (cb) {
      fn(cb);
    } else {
      return new Promise((resolve, reject) =>
        fn((err, res) => (err ? reject(err) : resolve(res))),
      );
    }
  }

  return invokeCallbackFn;
}
