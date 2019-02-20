import { injectNestClient, Post } from 'nest-client';
import { ICommandResultWithEvents, ICqrsClient, ISince } from '../core/cqrs.types';
import { ICommand, IQuery } from '../core/data';
import { CommonCommandResult } from '../core/helper.types';

export class NestCqrsClientStub implements ICqrsClient {
  constructor(baseUrl: string) {
    injectNestClient(this, {
      allowNonRestMethods: true,
      baseUrl,
    });
  }

  @Post('command/send')
  sendCommand<C, T, R = CommonCommandResult>(command: ICommand<C, T>): Promise<R> {
    return undefined;
  }

  @Post('command/send_and_get')
  sendCommandAndGetEvents<C, T, E, R = CommonCommandResult>(command: ICommand<C, T>): Promise<ICommandResultWithEvents<R, E>> {
    return undefined;
  }

  @Post('query')
  query<Q, R, T>(query: IQuery<Q, R, T>): Promise<R> {
    return undefined;
  }

  @Post('query/since/:since')
  querySince<Q, R, T>(query: IQuery<Q, R, T>, since: ISince): Promise<R> {
    return undefined;
  }
}
