import { Injectable } from '@nestjs/common';
import { NestCqrsService } from 'cqrs-exp';
import { config } from './config/values';

@Injectable()
export class AppService implements NestCqrsService {
  eventStore: IEventStore;
  constructor(){
    this.eventStore=config.eve
  }
  root(): string {
    return 'Hello World! cqrs demo';
  }


  handleCommand<C, T, R = CommonCommandResult>(command: ICommand<C, T>): Promise<R> {
    return undefined;
  }

  handleCommandAndGetEvents<C, T, E, R = CommonCommandResult>(command: ICommand<C, T>): Promise<ICommandResultWithEvents<R, E>> {
    return undefined;
  }

  handleEvents<E>(events: Array<IEvent<E>>): Promise<void> {
    return undefined;
  }

  handleQuery<Q, R, T>(query: IQuery<Q, R, T>): Promise<R> {
    return undefined;
  }

  handleQuerySince<Q, R, T>(query: IQuery<Q, R, T>, since: ISince): Promise<R> {
    return undefined;
  }
}
