export type id = number | string | { toString: () => string };

export type ConcreteTypeSelector = string[] | 'all';
export type GeneralTypeSelector = ConcreteTypeSelector | 'else';

export interface Command<T> {
  type: string;
  session: id;
  seq: number;
  payload: T;
}

/**
 * triggered by commands
 * */
export interface Event<T> {
  type: string;
  id: id;
  payload?: T;
}

/**
 * type to be AggregatedObject or ValueObject type
 * */
export interface Query<T, R> {
  type: string;
  session: id;
  seq: number;
  payload: T;
}

/**
 * aggregate object from events
 * a.k.a. View Model
 *
 * atomic unit with transaction support
 *
 * instance of Model object
 * */
export interface AggregateObject<T> {
  type: string;
  id: id;
  version: number;
  payload?: T;
}

export interface ValueObject<T> {
  type: string;
  payload: T;
}
