import { IModel } from '../model';
import { command as c, command_handler as ch, event as e, query as q, query_handler as qh } from '../types';

export interface BaseModelOptions {
  eventTypes: string[]
}

export class BaseModel<command extends c,
  event extends e,
  query extends q,
  response,
  command_handler extends ch<command, event>,
  query_handler extends qh<query, response>> implements IModel<command, event, query, response, command_handler, query_handler> {

  eventTypes: string[];

  commandHandlers: Map<string, command_handler>;
  queryHandlers: Map<string, query_handler>;

  constructor(options: BaseModelOptions) {
    this.eventTypes = options.eventTypes;

    this.commandHandlers = new Map();
    this.queryHandlers = new Map();
  }

  addCommandHandler(commandType: string, commandHandler: command_handler) {
    if (this.commandHandlers.has(commandType)) {
      console.warn('overriding command handler of type: ' + commandType);
    }
    this.commandHandlers.set(commandType, commandHandler);
  }

  addQueryHandler(queryType: string, queryHandler: query_handler) {
    if (this.queryHandlers.has(queryType)) {
      console.warn('overriding query handler of type: ' + queryType);
    }
    this.queryHandlers.set(queryType, queryHandler);
  }
}
