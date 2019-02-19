export type id = number | string;
export type seq = number;

export interface aggregated_object<D, T> {
  aggregate_id: id;
  /* version of last applied event */
  version: seq;
  type: T;
  data: D;
}

export interface event<E, T = string> {
  aggregate_id: id;
  version: seq;
  type: T;
  data: E;
}

export interface command<C, T = string> {
  aggregate_id: id;
  expected_version: seq;
  type: T;
  data: C;
}

export interface query<Q, T = string> {
  type: T;
  data: Q;
}

/* if failed, return string of error message */
export type response<R, T = string> =
  | string
  | {
      type: T;
      data: R;
    };

/* if failed, return string of error message */
export type event_handler<E, ET> = (event: event<E, ET>) => Promise<void>;

export type command_handler<C, E, CT, ET> = (
  command: command<C, CT>,
) => Array<event<E, ET>> | string;

export type query_handler<Q, R, QT, RT> = (
  query: query<Q, QT>,
) => Promise<response<R, RT>>;
