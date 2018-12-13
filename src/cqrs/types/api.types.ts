import { AggregateObject, Command, ConcreteTypeSelector, Event, GeneralTypeSelector, id, Query } from './data.types';

export type Consumer<T> = (t: T) => void;

/**
 * get data from AggregateObject
 * */
export interface QueryHandler<T, R> {
  queryTypes: GeneralTypeSelector;

  handleOne(query: Query<T, R>): Promise<R>

  handleAll(queries: Array<Query<T, R>>): Promise<R[]>
}

/**
 * map command into events
 * to be subscribed by state reducer (view model)
 * */
export interface CommandHandler<T> {
  commandTypes: GeneralTypeSelector

  handleOne(command: Command<T>): Promise<Array<Event<any>>>

  handleAll(commands: Array<Command<T>>): Promise<Array<Event<any>>>
}

export interface EventHandler<State, E> {
  eventTypes: GeneralTypeSelector;

  handleOne(state: State, event: Event<E>): Promise<State>

  handleAll(state: State, events: Array<Event<E>>): Promise<State>
}

export interface ModelStatus<State> {
  state: State
  version: number
}

/**
 * update internal state based on events
 *
 * maintain the state automatically, persist state if needed
 * */
export interface Model<State, E> {
  eventTypes: string[]
  objectTypes: string[]

  getStatus(): Promise<ModelStatus<State>>

  setStatus(status: ModelStatus<State>): Promise<void>

  reduceOne(event: Event<E>): Promise<State>

  reduceAll(events: Array<Event<E>>): Promise<State>
}

export interface CqrsEngine {

  /* write side */
  registerCommandHandler<T, R>(commandHandler: CommandHandler<T>)

  /* read side */
  registerQueryHandler<T, R>(queryHandler: QueryHandler<T, R>)

  registerModel<State, E>(model: Model<State, E>)

  getEventStore()

  getStateStore()
}

export interface EventStore<T> {
  store(event: Event<T>): Promise<void>

  get(id: id): Promise<Event<T>>

  getHeight(): Promise<number>

  /**
   * inclusive
   * */
  getAfter(types: ConcreteTypeSelector, height: number): Promise<Array<Event<T>>>

  listen(types: ConcreteTypeSelector, consumer: Consumer<T>)
}

export interface StateStore<T> {
  store(stateObject: AggregateObject<T>): Promise<void>

  get(id: id): Promise<AggregateObject<T>>

  find(types: TypeSelector, filter: (s: AggregateObject<T>) => boolean): Promise<Array<AggregateObject<T>>>
}
