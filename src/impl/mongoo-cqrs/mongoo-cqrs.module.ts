import { Module } from '@nestjs/common';
import { MongooEventStoreImpl } from './mongoo-event-store';
import { TypegooseModule } from 'nestjs-typegoose';
import { EventDBObject } from './store.model';

@Module({
  imports: [TypegooseModule.forFeature(
    EventDBObject,
  )],
  providers: [MongooEventStoreImpl],
  exports: [MongooEventStoreImpl],
})
export class MongooCqrsModule {
}
