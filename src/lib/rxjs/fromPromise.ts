import { Observable } from 'rxjs/internal/Observable';
import { create } from './create';

export function fromPromise<T>(f: () => Promise<T>): Observable<T> {
  let called = false;
  let p: Promise<T>;
  return create(observer => {
    if (!called) {
      called = true;
      p = f();
    }
    p.then(t => {
      observer.next(t);
      observer.complete();
    })
      .catch(e => observer.error(e));
  });
}
