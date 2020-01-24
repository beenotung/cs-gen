import { EventEmitter } from 'stream';

let emitter = new EventEmitter();
emitter.once('data', event => console.log([1, event]));
emitter.once('data', event => console.log([2, event]));
emitter.emit('data', 'foo');
emitter.once('data', event => console.log([3, event]));
emitter.emit('data', 'bar');
