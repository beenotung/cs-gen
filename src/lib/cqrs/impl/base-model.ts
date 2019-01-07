import { mapGetOrSetDefault } from '@beenotung/tslib/map';
import { CqrsEngine } from '../cqrs-engine';
import { Callback, IModel } from '../model';
import { command as c, command_handler as ch, event as e, query as q, query_handler as qh } from '../types';

/**
 * for snapshot
 * */
export interface BaseModelConfig {
  modelName: string
  eventHeights: Array<[string, number]>
}

export class BaseModel<command extends c,
  event extends e,
  query extends q,
  response,
  command_handler extends ch<command, event>,
  query_handler extends qh<query, response>> implements IModel<command, event, query, response, command_handler, query_handler> {

  commandHandlers: Map<string, command_handler>;
  queryHandlers: Map<string, query_handler>;
  eventHandlers: Map<string, Array<Callback<event>>>;

  constructor(public modelName: string,
              public cqrsEngine: CqrsEngine<command, event, query, response, command_handler, query_handler>) {
    this.commandHandlers = new Map();
    this.queryHandlers = new Map();
    this.eventHandlers = new Map();
  }

  addCommandHandler(commandType: string, commandHandler: command_handler) {
    if (this.commandHandlers.has(commandType)) {
      console.warn('overriding command handler of type: ' + commandType);
    }
    this.commandHandlers.set(commandType, commandHandler);
  }

  addEventHandler(eventType: string, eventHandler: Callback<event>) {
    mapGetOrSetDefault(this.eventHandlers, eventType, () => []).push(eventHandler);
  }

  addQueryHandler(queryType: string, queryHandler: query_handler) {
    if (this.queryHandlers.has(queryType)) {
      console.warn('overriding query handler of type: ' + queryType);
    }
    this.queryHandlers.set(queryType, queryHandler);
  }

  start() {
    const eventTypes: string[] = [];
    this.eventHandlers.forEach((f, type) => eventTypes.push(type));
    this.cqrsEngine.subscribeEvent(eventTypes, (err, event) => {
      if (err) {
        console.error(err);
      } else {
        this.eventHandlers.get(event.type).forEach(eventHandler => eventHandler(err, event));
      }
    });
  }
}
