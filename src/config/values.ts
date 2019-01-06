import { AppCqrsEngine } from './cqrs';
import { AppStore } from './store';

export let appStore = new AppStore();
export let cqrsEngine = new AppCqrsEngine();
