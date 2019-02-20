import { Injectable } from '@nestjs/common';
import {
  CommonCommandResult,
  ICommand,
  ICommandResultWithEvents,
  ID,
  IEvent,
  IEventStore,
  IQuery,
  ISince,
  JsonValue,
  NestCqrsService,
} from 'cqrs-exp';
import { AppCommand, config } from './config/values';

@Injectable()
export class AppService implements NestCqrsService {
  eventStore: IEventStore;

  constructor() {
    this.eventStore = config.eventStore;
  }

  root(): string {
    return 'Hello World! cqrs demo';
  }

  handleCommand(command: AppCommand): Promise<CommonCommandResult> {
    return undefined;
  }

  handleCommandAndGetEvents<C extends JsonValue, CT extends ID, E extends JsonValue, ET extends ID, R extends JsonValue = CommonCommandResult>(command: ICommand<C, CT>): Promise<ICommandResultWithEvents<R, E, ET>> {
    return undefined;
  }

  handleEvents<E extends JsonValue, T extends ID>(events: Array<IEvent<E, T>>): Promise<void> {
    return undefined;
  }

  handleQuery<Q extends JsonValue, R extends JsonValue, T extends ID>(query: IQuery<Q, R, T>): Promise<R> {
    return undefined;
  }

  handleQuerySince<Q extends JsonValue, R extends JsonValue, T extends ID>(query: IQuery<Q, R, T>, since: ISince): Promise<R> {
    return undefined;
  }
}
