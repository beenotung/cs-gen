import { Command } from './command';
import { DomainEvent } from './domain-event';

export interface LogicProcessor<State = any, C = Command, E = DomainEvent> {
  (state: State, message: C): E[];
}

export class System {
  logicProcesser;
}
