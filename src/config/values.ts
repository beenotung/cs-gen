import { CqrsEngineImpl } from '../lib/cqrs/impl/cqrs-engine';
import { RamEventStoreImpl } from '../lib/cqrs/impl/ram-event-store';
import { RamStateStore } from '../lib/cqrs/impl/ram-state-store';
import { UserModel } from '../models/user';
import '../models/user.cmd';

export let DATABASE_URI = 'mongodb://localhost:27017/test-db';

export let eventStore = new RamEventStoreImpl<any>();
export let stateStore = new RamStateStore<any>();
export let cqrsEngine = new CqrsEngineImpl();
cqrsEngine.setEventStore('all', eventStore);

cqrsEngine.registerModel(new UserModel(cqrsEngine));
cqrsEngine.startSyncAll();
