import { Command, DomainEvent, Model, Query } from '../model';

export class RouterModel<State> implements Model<State> {
  onCommands = new Map<string, Model['onCommand']>();
  onEvents = new Map<string, Model['onEvent']>();
  onQuerys = new Map<string, Model['onQuery']>();

  whenCommand(commandType: string, f: Model['onCommand']) {}

  whenEvent(eventType: string, f: Model['onEvent']) {}

  whenQuery(queryType: string, f: Model['onQuery']) {}

  onCommand(command: Command): Promise<DomainEvent[]> {
    return this.onCommands.get(command.type)(command);
  }

  onEvent(state: State, event: DomainEvent): Promise<State> {
    return this.onEvents.get(event.type)(state, event);
  }

  onQuery<Q extends Query>(query: Q): Promise<Q['response']> {
    return this.onQuerys.get(query.type)(query);
  }
}
