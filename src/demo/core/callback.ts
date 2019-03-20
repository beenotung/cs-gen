export type Result<T> = T | Promise<T>;
export type Handler<T, R = void> = (t: T) => Result<R>;
export type Mapper<T, R> = (t: T) => R;

export function then<A = void, B = void>(task1: () => Result<A>, task2: (a: A) => Result<B>): Result<B> {
  const result1 = task1();
  if (typeof result1 === 'object' && !!result1 && 'then' in result1) {
    return result1.then((a: A) => task2(a));
  }
  return task2(result1 as A);
}

export function all<A = void>(tasks: Array<(a: A) => Result<A>>, initial = void 0): Result<A> {
  switch (tasks.length) {
    case 0:
      return void 0;
    case 1:
      return tasks[0](initial);
    default: {
      const headTask = tasks[0];
      const tailTask = tasks.slice(1);
      return then(() => headTask(initial), result => all(tailTask, result));
    }
  }
}
