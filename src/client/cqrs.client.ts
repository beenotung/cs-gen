import { injectNestClient, Post } from 'nest-client';
import { ICqrsClient, ISince } from '../core/cqrs.types';
import { ICommand, ICommandResultWithEvents, IQuery } from '../core/data';
import { CommonCommandResult } from '../core/helper.types';
import { ID, JsonValue } from '../core/type';

export class NestCqrsClientStub implements ICqrsClient {
  constructor(baseUrl: string) {
    injectNestClient(this, {
      allowNonRestMethods: true,
      baseUrl,
    });
  }

  @Post('command/send')
  sendCommand<C extends JsonValue, T extends ID, R extends JsonValue = CommonCommandResult>(command: ICommand<C, T>): Promise<R> {
    return undefined;
  }

  @Post('command/send_and_get')
  sendCommandAndGetEvents<C extends JsonValue, CT extends ID, E extends JsonValue, ET extends ID, R extends JsonValue = CommonCommandResult>
  (command: ICommand<C, CT>): Promise<ICommandResultWithEvents<R, E, ET>> {
    return undefined;
  }

  @Post('query')
  query<Q extends JsonValue, R extends JsonValue, T extends ID>(query: IQuery<Q, R, T>): Promise<R> {
    return undefined;
  }

  @Post('query/since/:since')
  querySince<Q extends JsonValue, R extends JsonValue, T extends ID>(query: IQuery<Q, R, T>, since: ISince): Promise<R> {
    return undefined;
  }

}
