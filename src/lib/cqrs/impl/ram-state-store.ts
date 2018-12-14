import { HashedArray } from '@beenotung/tslib';
import { throwError } from '../../../utils/error';
import { isTypeMatch } from '../../../utils/type-utils';
import { AggregateObject, ConcreteTypeSelector, id } from '../types/data.types';
import { StateStore } from '../types/store.types';
import { idToString } from '../utils';

export class RamStateStore<T> implements StateStore<T> {
  states = new HashedArray<AggregateObject<T>>();

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
    return (
      this.states.get(idToString(id)) || throwError(new Error('not found'))
    );
  }

  async store(stateObject: AggregateObject<T>): Promise<void> {
    this.states.set(idToString(stateObject.id), stateObject);
  }
}
