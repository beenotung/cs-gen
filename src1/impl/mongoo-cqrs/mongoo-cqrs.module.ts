import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { MongooEventStoreImpl } from './mongoo-event-store';
import { MongooStateStoreImpl } from './mongoo-state-store-impl.service';
import { AggregateDBObject, EventDBObject } from './store.model';

@Module({
  imports: [TypegooseModule.forFeature(EventDBObject, AggregateDBObject)],
  providers: [MongooEventStoreImpl, MongooStateStoreImpl],
  exports: [MongooEventStoreImpl, MongooStateStoreImpl],
})
export class MongooCqrsModule {}
