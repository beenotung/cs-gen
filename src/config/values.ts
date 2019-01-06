import { userModel } from '../models/user/user-model';
import { AppCqrsEngine } from './cqrs';
import { AppStore } from './store';

export let appStore = new AppStore();

export let cqrsEngine = new AppCqrsEngine();

cqrsEngine.models.push(userModel);
cqrsEngine.start();
