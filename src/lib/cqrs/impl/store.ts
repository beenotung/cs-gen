import { HashedArray } from '@beenotung/tslib/hashed-array';
import { new_counter } from '@beenotung/tslib/uuid';
import { Store } from '../store';
import { DataObject, id } from '../types';
import { idToString, Mapper, partialMatch } from '../utils';

export class RamStoreImpl implements Store {
  data = new HashedArray<DataObject<any>>(x => idToString(x.id));

  counter = new_counter();

  async find<T>(qs: Array<Partial<DataObject<T>>>): Promise<Array<DataObject<T>>> {
    return this.data.array.filter(t =>
      qs.some(q => partialMatch(q, t)),
    );
  }

  async get<T>(id: id): Promise<DataObject<T>> {
    return this.data.get(idToString(id));
  }

  async match<T>(pred: Mapper<DataObject<T>, boolean>): Promise<Array<DataObject<T>>> {
    return this.data.array.filter(pred);
  }

  async newId(): Promise<id> {
    return 'ram-' + this.counter.next();
  }

  async store<T>(data: DataObject<T>): Promise<void> {
    this.data.upsert(data);
  }
}
