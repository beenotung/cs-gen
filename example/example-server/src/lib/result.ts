export type Result<T> = T | Promise<T>

export function isPromise(x: Result<any>): boolean {
  const p = x as Promise<any>
  return (
    x instanceof Promise ||
    (p && typeof p === 'object' && typeof p.then === 'function')
  )
}

export function then<T, R>(x: Result<T>, f: (x: T) => Result<R>): Result<R> {
  const p = x as Promise<T>
  if (
    x instanceof Promise ||
    (p && typeof p === 'object' && typeof p.then === 'function')
  ) {
    return p.then(f)
  }
  return f(x as T)
}
