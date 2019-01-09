import { command, query, response } from '../types';

export let tables = {
  event: 'event',
  command_response: 'command_response',
  query_response: 'query_response',
  aggregated_object: 'aggregated_object',
};

/**
 * if handled, either error or ok will be set
 * */
export interface command_response<C, CT> {
  command: command<C, CT>
  error?: string
  ok?: boolean
}

export interface query_response<Q, R, QT, RT> {
  query: query<Q, QT>
  response?: response<R, RT>
}
