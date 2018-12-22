import * as mongoose from 'mongoose';
import { CqrsEngineImpl } from '../lib/cqrs/impl/ram-cqrs-engine';
import { RamEventStoreImpl } from '../lib/cqrs/impl/ram-event-store';
import { RamStoreImpl } from '../lib/cqrs/impl/ram-store';

export const DATABASE_URI = 'mongodb://localhost:27017/test';
export const VALUES = {
  mongoose: mongoose.connect(DATABASE_URI),
};
export const eventStore = new RamEventStoreImpl();
export const cqrsEngine = new CqrsEngineImpl(() => eventStore);
export const store = new RamStoreImpl();
