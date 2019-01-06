import { Consumer } from '@beenotung/tslib/functional/types';
import { command as c, command_handler as ch, event as e, query as q, query_handler as qh } from './types';

export interface IModel<command extends c,
  event extends e,
  query extends q,
  response,
  command_handler extends ch<command, event>,
  query_handler extends qh<query, response>> {

  modelName?: string

  commandHandlers: Map<string, command_handler>
  queryHandlers: Map<string, query_handler>
  eventHandlers: Map<string, Array<Consumer<event>>>

  ready: Promise<void>
}
