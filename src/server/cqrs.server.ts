import { Post } from 'nest-client';
import { ID, JsonValue } from '..';
import { ICqrsClient, ICqrsReadServer, ICqrsWriteServer, ISince } from '../core/cqrs.types';
import { ICommand, ICommandResultWithEvents, IQuery } from '../core/data';
import { CommonCommandResult } from '../core/helper.types';

export interface NestCqrsService extends ICqrsReadServer, ICqrsWriteServer {

}

export class NestCqrsControllerStub implements ICqrsClient {
  constructor(public service: NestCqrsService) {
  }

  @Post('command/send')
  sendCommand<C extends JsonValue, T extends ID, R extends JsonValue = CommonCommandResult>(command: ICommand<C, T>): Promise<R> {
    return this.service.handleCommand(command);
  }

  @Post('command/send_and_get')
  sendCommandAndGetEvents<C extends JsonValue, CT extends ID, E extends JsonValue, ET extends ID, R extends JsonValue = CommonCommandResult>
  (command: ICommand<C, CT>): Promise<ICommandResultWithEvents<R, E, ET>> {
    return this.service.handleCommandAndGetEvents(command);
  }

  @Post('query')
  query<Q extends JsonValue, R extends JsonValue, T extends ID>(query: IQuery<Q, R, T>): Promise<R> {
    return this.service.handleQuery(query);
  }

  @Post('query/since/:since')
  querySince<Q extends JsonValue, R extends JsonValue, T extends ID>(query: IQuery<Q, R, T>, since: ISince): Promise<R> {
    return this.service.handleQuerySince(query, since);
  }
}
