import * as mongoose from 'mongoose';
import { CqrsEngineImpl } from '../lib/cqrs/core';
import { RamEventStoreImpl } from '../lib/cqrs/impl/event-store';
import { RamStoreImpl } from '../lib/cqrs/impl/store';

export const DATABASE_URI = 'mongodb://localhost:27017/test';
export const VALUES = {
  mongoose: mongoose.connect(DATABASE_URI),
};
export const cqrsEngine = new CqrsEngineImpl();
export const eventStore = new RamEventStoreImpl();
export const store = new RamStoreImpl();
