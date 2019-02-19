import { Observable } from 'rxjs/internal/Observable';
import { Observer, TeardownLogic } from 'rxjs/internal/types';

export function create<T>(
  f: (observer: Observer<T>) => TeardownLogic,
): Observable<T> {
  return Observable.create(f);
}
