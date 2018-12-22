import { HashedArray } from '@beenotung/tslib/hashed-array';
import { search } from '@beenotung/tslib/search';
import { new_counter } from '@beenotung/tslib/uuid';
import { Store } from '../store';
import { DataObject, id } from '../types';
import { idToString, Mapper } from '../utils';
import partialMatch = search.partialMatch;

export class RamStoreImpl<T> implements Store<T> {
  data = new HashedArray<DataObject<any>>(x => idToString(x.id));

  counter = new_counter();

  async find(
    ...qs: Array<Partial<DataObject<T>>>
  ): Promise<Array<DataObject<T>>> {
    return this.data.array.filter(t => qs.some(q => partialMatch(q, t)));
  }

  async match(
    pred: Mapper<DataObject<T>, boolean>,
  ): Promise<Array<DataObject<T>>> {
    return this.data.array.filter(pred);
  }

  async get(id: id): Promise<DataObject<T>> {
    return this.data.get(idToString(id));
  }

  async newId(): Promise<id> {
    return 'ram-' + this.counter.next();
  }

  async store(data: DataObject<T>): Promise<void> {
    this.data.upsert(data);
  }
}
