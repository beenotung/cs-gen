import { Command, Event, GeneralTypeSelector, Query } from './data.types';
import { EventStore, StateStore } from './store.types';

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
  eventTypes: GeneralTypeSelector
  objectTypes: string[]

  getStatus(): Promise<ModelStatus<State>>

  setStatus(status: ModelStatus<State>): Promise<void>

  reduceOne(event: Event<E>): Promise<State>

  reduceAll(events: Array<Event<E>>): Promise<State>

  registerEventHandler(eventHandler: EventHandler<State, E>): this

  getEventStore<T extends E>(eventType: GeneralTypeSelector): Promise<EventStore<T>>

  getStateStore<T extends State>(stateType: GeneralTypeSelector): Promise<StateStore<T>>
}

export interface CqrsEngine {

  /* write side */
  registerCommandHandler<T, R>(commandHandler: CommandHandler<T>)

  /* read side */
  registerQueryHandler<T, R>(queryHandler: QueryHandler<T, R>)

  registerModel<State, E>(model: Model<State, E>)

  getModel<State, E>(objectType: string): Model<State, E>

  getEventStore<T>(eventType: GeneralTypeSelector): Promise<EventStore<T>>

  getStateStore<T>(stateType: GeneralTypeSelector): Promise<StateStore<T>>

}
