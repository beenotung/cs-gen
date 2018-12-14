/* use typegoose to persist and query data */
import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';
import { InjectModel } from 'nestjs-typegoose';
import { ModelType } from 'typegoose';
import { Consumer } from '../../lib/cqrs/types/api.types';
import { ConcreteTypeSelector, id } from '../../lib/cqrs/types/data.types';
import { EventStore } from '../../lib/cqrs/types/store.types';
import { EventDBObject } from './store.model';

@Injectable()
export class MongooEventStoreImpl<T> implements EventStore<T> {
  storeEmitter = new EventEmitter();

  constructor(
    @InjectModel(EventDBObject)
    public readonly model: ModelType<EventDBObject<T>>,
  ) {}

  async get(id: id): Promise<EventDBObject<T>> {
    return this.model.findById(id).findOne();
  }

  async getAfter(
    types: ConcreteTypeSelector,
    height: number,
  ): Promise<Array<EventDBObject<T>>> {
    return this.model.find({}).skip(height);
  }

  async getHeight(): Promise<number> {
    return this.model.estimatedDocumentCount();
  }

  listen(
    types: ConcreteTypeSelector,
    consumer: Consumer<Array<EventDBObject<T>>>,
  ) {
    this.storeEmitter.on('data', consumer);
  }

  async storeAll(events: Array<EventDBObject<T>>): Promise<void> {
    const datas = events.map(event => {
      const data = new (this.model.getModelForClass(EventDBObject))();
      Object.assign(data, event);
      return data;
    });
    // FIXME makes it store all atomically
    await Promise.all(datas.map(data => data.save()));
    this.storeEmitter.emit('data', events);
  }

  storeOne(event: EventDBObject<T>): Promise<void> {
    return this.storeAll([event]);
  }
}
