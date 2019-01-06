import * as mongoose from 'mongoose';
import { CqrsEngineImpl } from '../lib/cqrs/impl/ram-cqrs-engine';
import { RamEventStoreImpl } from '../lib/cqrs/impl/ram-event-store';
import { RamStoreImpl } from '../lib/cqrs/impl/ram-store';
import {
  CommandType,
  EventType,
  QueryInputType,
  QueryResultType,
  QueryType,
} from './types';

export const DATABASE_URI = 'mongodb://localhost:27017/test';
export const VALUES = {
  mongoose: mongoose.connect(DATABASE_URI),
};
export const eventStore = new RamEventStoreImpl<EventType>();
export const cqrsEngine = new CqrsEngineImpl<
  CommandType,
  EventType,
  QueryInputType,
  QueryResultType,
  QueryType
>(() => eventStore);
export const store = new RamStoreImpl();
