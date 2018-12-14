import { HashedArray } from '@beenotung/tslib';
import { isTypeMatch } from '../../../utils/type-utils';
import { AggregateObject, ConcreteTypeSelector, id } from '../types/data.types';
import { StateStore } from '../types/store.types';
import { idToString } from '../utils';

export class RamStateStore<T> implements StateStore<T> {
  states = new HashedArray<AggregateObject<T>>(x => idToString(x.id));

  async find(
    types: ConcreteTypeSelector,
    filter: (s: AggregateObject<T>) => boolean,
  ): Promise<Array<AggregateObject<T>>> {
    return this.states.array.filter(x => {
      if (!isTypeMatch(x.type, types)) {
        return false;
      }
      return filter(x);
    });
  }

  async get(id: id): Promise<AggregateObject<T>> {
    return this.states.get(idToString(id)) || null;
  }

  async store(stateObject: AggregateObject<T>): Promise<void> {
    this.states.upsert(stateObject);
  }

  async getAll(): Promise<Array<AggregateObject<T>>> {
    return this.states.array;
  }

  async storeAll(stateObjects: Array<AggregateObject<T>>): Promise<void> {
    for (const stateObject of stateObjects) {
      this.states.upsert(stateObject);
    }
  }
}
