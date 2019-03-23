import 'reflect-metadata';

export interface Model<State = any> {
  /**
   * foldl
   * */
  onEvent(state: State, event: DomainEvent): Promise<State>;

  onCommand(command: Command): Promise<DomainEvent[]>;

  onQuery<Q extends Query>(query: Q): Promise<Q['response']>;
}
