import { Body, Controller, Post } from '@nestjs/common';
import { ICqrsReadServer, ICqrsWriteServer, IEventStore } from '../core/cqrs.types';
import { ICommand, ICommandWithEvents, IQuery } from '../core/data';
import { ID, JsonValue, pos_int } from '../core/type';
import { CommandRouterService } from './command-router.service';
import { QueryRouterService } from './query-router.service';

@Controller('model')
export class ModelRouterController implements ICqrsWriteServer, ICqrsReadServer {
  /**@deprecated*/
  eventStore: IEventStore = null;

  constructor(
    public commandService: CommandRouterService<any>,
    public queryService: QueryRouterService<any>,
  ) {
  }

  @Post('command')
  handleCommand<Command extends ICommand<C, R, CT>, C extends JsonValue, R extends JsonValue, CT extends ID>
  (@Body('command') command: Command): Promise<Command> {
    return this.commandService.handleCommand(command);
  }

  @Post('command/events')
  handleCommandAndGetEvents<Command extends ICommandWithEvents<C, R, E, CT, ET>,
    C extends JsonValue, R extends JsonValue, E extends JsonValue, CT extends ID, ET extends ID>
  (@Body('command') command: Command): Promise<Command> {
    return this.commandService.handleCommandAndGetEvents(command);
  }

  @Post('query')
  handleQuery<Query extends IQuery<Q, R, QT>, Q extends JsonValue, R extends JsonValue, QT extends ID>
  (@Body('query') query: Query): Promise<Query> {
    return this.queryService.handleQuery(query);
  }

  @Post('query/since')
  handleQuerySince<Query extends IQuery<Q, R, QT>, Q extends JsonValue, R extends JsonValue, QT extends ID>
  (@Body('query') query: Query, @Body('sinceTimestamp') sinceTimestamp: pos_int): Promise<Query> {
    return this.queryService.handleQuerySince(query, sinceTimestamp);
  }

}
