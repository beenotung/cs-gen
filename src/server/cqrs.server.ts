import { Post } from 'nest-client';
import { ICommandResultWithEvents, ICqrsClient, ICqrsReadServer, ICqrsWriteServer, ISince } from '../core/cqrs.types';
import { ICommand, IQuery } from '../core/data';
import { CommonCommandResult } from '../core/helper.types';

export interface NestCqrsService extends ICqrsReadServer, ICqrsWriteServer {

}

export class NestCqrsControllerStub implements ICqrsClient {
  constructor(public service: NestCqrsService) {
  }

  @Post('command/send')
  sendCommand<C, T, R = CommonCommandResult>(command: ICommand<C, T>): Promise<R> {
    return this.service.handleCommand(command);
  }

  @Post('command/send_and_get')
  sendCommandAndGetEvents<C, T, E, R = CommonCommandResult>(command: ICommand<C, T>): Promise<ICommandResultWithEvents<R, E>> {
    return this.service.handleCommandAndGetEvents(command);
  }

  @Post('query')
  query<Q, R, T>(query: IQuery<Q, R, T>): Promise<R> {
    return this.service.handleQuery(query);
  }

  @Post('query/since/:since')
  querySince<Q, R, T>(query: IQuery<Q, R, T>, since: ISince): Promise<R> {
    return this.service.handleQuerySince(query, since);
  }
}
