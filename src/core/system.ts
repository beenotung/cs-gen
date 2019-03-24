import {Command} from './command';
import {DomainEvent} from './domain-event';

export interface LogicProcessor<State = any, C = Command, E = DomainEvent> {
  (state: State, command: C): E[];
}

/**
 * must guarantee the command ordering
 * */
export interface InputProcessor<C = Command> {
  /**
   * sink in the command
   * - validate
   * - persist
   * - replicate
   * then to be passed to logic processor
   * */
  (command: C): Promise<C>
}

/**
 * must be free of side-effect
 * */
export interface LogicProcessor<State = any, C = Command, E = DomainEvent> {
  /**
   * - in-memory maintain internal state
   * - no side-effect
   * - single-threaded, sequential
   * - reproducible
   * - keep state across the input command stream
   * - output event stream to be passed to Output Processor
   * */
  (command: C): E[]
}

/**
 * must persist the event in order
 * */
export interface OutputProcessor<E = DomainEvent> {
  /**
   * sink in the event stream from logic processor
   * - persist
   * - publish to pub-sub system (e.g. to view model)
   * */
  (events: E[]): Promise<E[]>
}

export interface SequenceGenerator {

}

export interface SystemProcessor<C = Command, E = DomainEvent, State = any> {
  inputProcessor: InputProcessor<C>
  logicProcessor: LogicProcessor<State, C, E>
  outputProcessor: OutputProcessor<E>
}

export class System<C = Command, E = DomainEvent, State = any> {
  constructor(public systemProcessor: SystemProcessor<C, E, State>) {
  }

  async sinkCommand(command: C): Promise<E[]> {
    command = await this.systemProcessor.inputProcessor(command);
    let events = this.systemProcessor.logicProcessor(command);
    return events;
  }
}
