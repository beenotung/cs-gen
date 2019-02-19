import {
  command,
  command_handler,
  event_handler,
  query_handler,
} from './types';

export interface domain<E, C, Q, R, ET, CT, QT, RT, query_handler> {
  name: string;

  event_types: ET[];
  command_types: CT[];
  query_types: QT[];

  event_handler: event_handler<E, ET>;
  command_handler: command_handler<C, E, CT, ET>;
  query_handler: query_handler;
}

export interface cqrs_engine<
  E,
  C,
  Q,
  R,
  ET,
  CT,
  QT,
  RT,
  qh extends query_handler<Q, R, QT, RT>
> {
  requestQueryResponse: qh;

  sendCommand(command: command<C, CT>): Promise<void>;
}
