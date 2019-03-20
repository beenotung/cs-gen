export interface DomainEvent<T = string, E = any> {
  id: string
  type: T
  event: E
}

export interface Query<T = string, Q = any, R = any> {
  id: string
  type: T
  query: Q
  response: R
}

export interface Command<T = string, C = any, E = any> {
  id: string
  type: T
  command: C
  events: E[]
}

export interface Model<State = any> {
  /**
   * foldl
   * */
  onEvent(state: State, event: DomainEvent): Promise<State>

  onCommand(command: Command): Promise<DomainEvent[]>

  onQuery<Q extends Query>(query: Q): Promise<Q['response']>
}


