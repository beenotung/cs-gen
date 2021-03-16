export type Result<T> = T | Promise<T>;

export function then<T, R>(
  result: Result<T>,
  fn: (result: T) => Result<R>,
): Result<R> {
  if (
    result &&
    typeof result === 'object' &&
    typeof (result as Promise<T>).then === 'function'
  ) {
    return (result as Promise<T>).then(fn);
  }
  return fn(result as T);
}
