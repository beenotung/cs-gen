import {
  Command,
  ConcreteTypeSelector,
  Event,
  GeneralTypeSelector,
  Query,
} from './data.types';
import { EventStore, StateStore } from './store.types';

export type Consumer<T> = (t: T) => void;

/**
 * get data from AggregateDBObject
 * */
export interface QueryHandler<T, R> {
  queryTypes: GeneralTypeSelector;

  handle(query: Query<T, R>): Promise<R>;
}

/**
 * map command into events
 * to be subscribed by state reducer (view model)
 * */
export interface CommandHandler<T> {
  commandTypes: GeneralTypeSelector;

  handle(command: Command<T>): Promise<Array<Event<any>>>;
}

export interface EventHandler<State, E> {
  eventTypes: GeneralTypeSelector;

  handle(
    state: ModelStatus<State>,
    event: Event<E>,
  ): Promise<ModelStatus<State>>;
}

export interface ModelStatus<State> {
  state: State;
  version: number;
}

/**
 * view model, maintain the aggregate objects
 *
 * update internal state based on events
 *
 * maintain the state automatically, persist state if needed
 * */
export interface Model<State, E> {
  objectType: string;
  eventTypes: ConcreteTypeSelector;

  /**
   * resolve when finished initial sync
   * will keep auto-update in the background
   * */
  startSync(): Promise<void>;

  syncOnce(): Promise<void>;

  /**
   * check the events' heights to determine diff
   * */
  isSynced(): Promise<boolean>;

  /**
   * to make snapshot
   * */
  getStatus(): Promise<ModelStatus<State>>;

  /**
   * when restore from snapshot
   * */
  setStatus(status: ModelStatus<State>): Promise<void>;

  /**
   * also handle persistence internally
   * */
  handleEvent(events: Event<E>): Promise<void>;

  /**
   * batch version of handleEvent, reduced IO for persistence
   * */
  handleEvents(events: Array<Event<E>>): Promise<void>;

  /**
   * the handler should be invoked by this.handleEvents()
   * */
  registerEventHandler(eventHandler: EventHandler<State, E>): this;

  /**
   * injected by cqrs engine
   * */
  getEventStore(eventType: string): Promise<EventStore<E>>;

  /**
   * injected by cqrs engine
   * */
  getStateStore(stateType: string): Promise<StateStore<State>>;
}

export interface CqrsEngine {
  /* write side */
  registerCommandHandler<T, R>(commandHandler: CommandHandler<T>): this;

  fireCommand<T>(cmd: Command<T>): Promise<void>;

  /* read side */
  registerQueryHandler<T, R>(queryHandler: QueryHandler<T, R>): this;

  query<T, R>(query: Query<T, R>): Promise<R>;

  /* object holding */
  registerModel<State, E>(model: Model<State, E>): this;

  getModel<State, E>(objectType: string): Model<State, E>;

  // genModel<State, E>(objectType: string): Model<State, E>

  getEventStore<T>(eventType: string): Promise<EventStore<T>>;

  getStateStore<T>(stateType: string): Promise<StateStore<T>>;

  syncOnce(model: Model<any, any>): Promise<void>;

  startSync(model: Model<any, any>): Promise<void>;
}
