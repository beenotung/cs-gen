import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-typegoose';
import {
  AggregateObject,
  ConcreteTypeSelector,
  id,
} from '../../lib/cqrs/types/data.types';
import { StateStore } from '../../lib/cqrs/types/store.types';
import { idToString } from '../../lib/cqrs/utils';
import { AggregateDBObject } from './store.model';

@Injectable()
export class MongooStateStoreImpl<T> implements StateStore<T> {
  constructor(@InjectModel(AggregateDBObject) public readonly model) {}

  async find(
    types: ConcreteTypeSelector,
    filter: (s: AggregateObject<T>) => boolean,
  ): Promise<Array<AggregateObject<T>>> {
    const selector = {} as any;
    if (Array.isArray(types)) {
      selector.type = types;
    }
    return this.model.find(selector).$where(filter);
  }

  get(id: id): Promise<AggregateObject<T>> {
    return this.model.findById(idToString(id));
  }

  async store(stateObject: AggregateObject<T>): Promise<void> {
    const data = new (this.model.getModelForClass(AggregateDBObject))();
    Object.assign(data, stateObject);
    await data.save();
  }

  getAll(): Promise<Array<AggregateObject<T>>> {
    return undefined;
  }

  storeAll(stateObjects: Array<AggregateObject<T>>): Promise<void> {
    return Promise.all(stateObjects.map(x => this.store(x))).then(() => void 0);
  }
}
