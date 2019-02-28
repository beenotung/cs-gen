import { id, JsonValue } from './util-types';
import { Handler } from './callback';
import { mapGetOrSetDefault } from '@beenotung/tslib/map';
import { remove } from '@beenotung/tslib/array';

export class Dispatcher<Type extends id = any, Data extends JsonValue = any> {
  handlers = new Map<Type, Array<Handler<any>>>();

  register<E>(type: Type, handler: Handler<E>): void {
    mapGetOrSetDefault(this.handlers, type, () => []).push(handler);
  }

  /**
   * @param type: must be the same type when called register()
   * @param handler: must be the same object when called register()
   * */
  unregister<E>(type: Type, handler: Handler<E>): void {
    let handlers = mapGetOrSetDefault(this.handlers, type, () => []);
    remove(handlers, handler);
  }

  dispatch(type: Type, data: Data): void {
    if (this.handlers.has(type)) {
      this.handlers.get(type).forEach(handler => {
        try {
          handler(data);
        } catch (e) {
          console.error(e);
        }
      });
    }
  }
}
