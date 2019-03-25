import { Command } from './command';
import { DomainEvent } from './domain-event';

export type LogicProcessor<State = any, C = Command, E = DomainEvent> = (
  state: State,
  command: C,
) => E[];

/**
 * must guarantee the command ordering
 * */
export type InputProcessor<C = Command> = (command: C) => Promise<C>;

/**
 * must be free of side-effect
 * */
export type LogicProcessor<State = any, C = Command, E = DomainEvent> = (
  command: C,
) => E[];

/**
 * must persist the event in order
 * */
export type OutputProcessor<E = DomainEvent> = (events: E[]) => Promise<E[]>;

export interface SequenceGenerator {}

export interface SystemProcessor<C = Command, E = DomainEvent, State = any> {
  inputProcessor: InputProcessor<C>;
  logicProcessor: LogicProcessor<State, C, E>;
  outputProcessor: OutputProcessor<E>;
}

export class System<C = Command, E = DomainEvent, State = any> {
  constructor(public systemProcessor: SystemProcessor<C, E, State>) {}

  async sinkCommand(command: C): Promise<E[]> {
    command = await this.systemProcessor.inputProcessor(command);
    const events = this.systemProcessor.logicProcessor(command);
    return events;
  }
}
