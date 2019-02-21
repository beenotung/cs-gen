import { Body, injectNestClient, Post } from 'nest-client';
import { ICqrsClient } from '../core/cqrs.types';
import { ICommand, ICommandWithEvents, IQuery } from '../core/data';
import { ID, JsonValue, pos_int } from '../core/type';

export class NestCqrsClientStub implements ICqrsClient {
  constructor(baseUrl: string) {
    injectNestClient(this, {
      allowNonRestMethods: true,
      baseUrl,
    });
  }

  @Post('command')
  sendCommand<Command extends ICommand<C, R, CT>, C extends JsonValue, R extends JsonValue, CT extends ID>
  (@Body('command') command: Command): Promise<Command> {
    return undefined;
  }

  @Post('command/events')
  sendCommandAndGetEvents<Command extends ICommandWithEvents<C, R, E, CT, ET>,
    C extends JsonValue, R extends JsonValue, E extends JsonValue, CT extends ID, ET extends ID>
  (@Body('command') command: Command): Promise<Command> {
    return undefined;
  }

  @Post('query')
  query<Query extends IQuery<Q, R, QT>, Q extends JsonValue, R extends JsonValue, QT extends ID>
  (@Body('query') query: Query): Promise<Query> {
    return undefined;
  }

  @Post('query/since')
  querySince<Query extends IQuery<Q, R, QT>, Q extends JsonValue, R extends JsonValue, QT extends ID>
  (@Body('query') query: Query, @Body('sinceTimestamp') sinceTimestamp: pos_int): Promise<Query> {
    return undefined;
  }

}
