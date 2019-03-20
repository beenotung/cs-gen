export interface BaseData<T> {
  id: string;
  type: T;
  timestamp?: number;
}

export interface DomainEvent<T = string, E = any> extends BaseData<T> {
  event: E;
}

export interface Query<T = string, Q = any, R = any> extends BaseData<T> {
  query: Q;
  response: R;
}

export interface Command<T = string, C = any, E = any> extends BaseData<T> {
  command: C;
  events: E[];
}

export interface Model<State = any> {
  /**
   * foldl
   * */
  onEvent(state: State, event: DomainEvent): Promise<State>;

  onCommand(command: Command): Promise<DomainEvent[]>;

  onQuery<Q extends Query>(query: Q): Promise<Q['response']>;
}
