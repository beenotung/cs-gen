import { LocalStore } from '../lib/cqrs/impl/local-store';
import { UserModel } from '../models/user/user-model';
import { AppCqrsEngine } from './cqrs';

export let store = new LocalStore();
// export let store = new RethinkdbStore({ table: 'data' });

export let cqrsEngine = new AppCqrsEngine();

export let userModel = new UserModel(cqrsEngine);
cqrsEngine.models.push(userModel);
export let engineReady = cqrsEngine.start();
