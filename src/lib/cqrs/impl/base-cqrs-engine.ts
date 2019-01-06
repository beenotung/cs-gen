import { CqrsEngine } from '../cqrs-engine';
import { IModel } from '../model';
import { Store } from '../store';
import { command as c, command_handler as ch, event as e, query as q, query_handler as qh } from '../types';

export abstract class BaseCqrsEngine<command extends c,
  event extends e,
  query extends q,
  response,
  command_handler extends ch<command, event>,
  query_handler extends qh<query, response>>
  implements CqrsEngine<command, event, query, response, command_handler, query_handler> {

  defaultModel: IModel<command, event, query, response, command_handler, query_handler>;
  models: Array<IModel<command, event, query, response, command_handler, query_handler>>;

  constructor() {
    this.defaultModel = {
      modelName: 'DefaultModel',
      queryHandlers: new Map(),
      commandHandlers: new Map(),
      eventHandlers: new Map(),
    };
    this.models = [this.defaultModel];
  }

  async fireCommand(cmd: command): Promise<void> {
    const errors: string[] = [];
    let nDone = 0;
    let nError = 0;
    await Promise.all(
      this.models
        .map(m => m.commandHandlers.get(cmd.type))
        .filter(f => f)
        .map(f => f(cmd))
        .map(eventsOrReason => {
          if (Array.isArray(eventsOrReason)) {
            nDone++;
            return this.storeEvents(eventsOrReason);
          } else {
            errors.push(eventsOrReason);
            nError++;
            return;
          }
        })
        .filter(p => p),
    );
    if (nDone === 0 && nError === 0) {
      throw Error('no command handler of type: ' + cmd.type);
    }
    return errors.length === 0
      ? Promise.resolve()
      : Promise.reject(errors)
      ;
  }

  storeEvents(events: event[]): Promise<void> {
    return Promise.all(
      events.map(event => this.getEventStore(event.type).store(event)),
    )
      .then(() => void 0);
  }

  query(query: query): response {
    const fs = this.models
      .map(m => m.queryHandlers.get(query.type))
      .filter(f => f)
    ;
    if (fs.length < 1) {
      throw new Error('no query handler for type: ' + query.type);
    }
    if (fs.length > 1) {
      console.warn('multiple (conflict) query handler for type: ' + query.type);
    }
    return fs[0](query);
  }

  registerCommandHandler(commandType: string, command_handler: command_handler) {
    if (this.defaultModel.commandHandlers.has(commandType)) {
      console.warn('override command handler of type: ' + commandType);
    }
    this.defaultModel.commandHandlers.set(commandType, command_handler);
  }

  abstract getEventStore(eventType: string): Store<event>;

  registerQueryHandler(queryType: string, query_handler: query_handler) {
    if (this.defaultModel.queryHandlers.has(queryType)) {
      console.warn('override query handler of type: ' + queryType);
    }
    this.defaultModel.queryHandlers.set(queryType, query_handler);
  }

  subscribeEvent<e extends event>(eventType: string, onEvent: (event: e) => void) {
    // if (this.defaultModel.eventTypes.indexOf(eventType) === -1) {
    //   this.defaultModel.eventTypes.push(eventType);
    // }
    this.getEventStore(eventType).subscribe(eventType, onEvent);
  }

  start() {
    this.models.forEach(model =>
      model.eventHandlers.forEach((eventHandlers, eventType) =>
        this.subscribeEvent(eventType,
          event => eventHandlers.forEach(eventHandler => eventHandler(event)))));
  }
}
