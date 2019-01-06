import { Store } from './store';
import { command as c, command_handler as ch, event as e, query as q, query_handler as qh } from './types';

export interface CqrsEngine<command extends c,
  event extends e,
  query extends q,
  response,
  command_handler extends ch<command, event>,
  query_handler extends qh<query, response>> {

  fireCommand(cmd: command): Promise<void>

  storeEvents(events: event[]): Promise<void>

  query(query: query): response

  getEventStore(eventType: string): Store<event>

  registerCommandHandler(commandType: string, command_handler: command_handler)

  registerQueryHandler(queryType: string, query_handler: query_handler)

  subscribeEvent<e extends event>(eventType: string, onEvent: (event: e) => void)
}
