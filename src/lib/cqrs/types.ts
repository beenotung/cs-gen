export type id = number | string;
export type seq = number;

export interface event<E, T = string> {
  aggregate_id: id
  version: seq
  data: E
  type: T
}

/**@deprecated*/
export type aggregate_object = {
  id: id
  /* version of last applied event */
  version: seq;
} & any;

export interface command<C, T = string> {
  type: T
  data: C
}

export interface query<Q, T = string> {
  type: T
  data: Q
}

export interface response<R, T = string> {
  type: T
  data: R
}

export type query_handler<Q, R, QT, RT> =
  (query: query<Q, QT>) => response<R, RT>;

export type command_handler<C, E, CT, ET> =
  (command: command<C, CT>) => Array<event<E, ET>> | string;
