import { Types } from 'mongoose';
import { prop, Typegoose } from 'typegoose';
import { Event } from '../../lib/cqrs/types/data.types';

export class EventDBObject<T> extends Typegoose implements Event<T> {
  @prop({ required: true })
  type: string;

  @prop({ _id: true })
  id: Types.ObjectId;

  @prop()
  payload?: T;
}

export const EventDBObjectModel = new EventDBObject().getModelForClass(
  EventDBObject,
);
export const EventObjectSchema = EventDBObjectModel.schema;

export class AggregateDBObject<T> extends Typegoose
  implements AggregateDBObject<T> {
  @prop({ required: true })
  type: string;

  @prop({ _id: true })
  id: Types.ObjectId;

  @prop()
  payload?: T;
}

export const AggregateDBObjectModel = new AggregateDBObject().getModelForClass(
  AggregateDBObject,
);
export const AggregateDBObjectSchema = AggregateDBObjectModel.schema;
