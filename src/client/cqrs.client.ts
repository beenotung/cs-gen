import { ICqrsClient } from '../core/cqrs.types';
import { ICommand, IEvent, IQuery } from '../core/data';

export class NestCqrsClientStub implements ICqrsClient {
  sendCommand<C, T>(command: ICommand<C, T>): Promise<void> {
    return undefined;
  }

  sendCommandAndGetEvents<C, T, E>(command: ICommand<C, T>): Promise<Array<IEvent<E>>> {
    return undefined;
  }

  sendQuery<Q, R, T>(query: IQuery<Q, R, T>): Promise<R> {
    return undefined;
  }
}
