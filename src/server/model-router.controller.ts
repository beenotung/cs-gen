import { Body, Controller, Post } from '@nestjs/common';
import { ICqrsReadServer, ICqrsWriteServer, IEventStore } from '../core/cqrs.types';
import { ICommand, ICommandWithEvents, IQuery } from '../core/data';
import { pos_int } from '../core/type';
import { CommandRouterService } from './command-router.service';
import { QueryRouterService } from './query-router.service';

@Controller('model')
export class ModelRouterController<Command extends ICommand<any, any, any>,
  CommandWithEvents extends ICommandWithEvents<any, any, any, any, any>,
  Query extends IQuery<any, any, any>,
  > implements ICqrsWriteServer<any, any, any, any, any, any, any>, ICqrsReadServer<any, any, any, any> {
  /**@deprecated*/
  eventStore: IEventStore = null;

  constructor(
    public commandService: CommandRouterService<any, Command, CommandWithEvents>,
    public queryService: QueryRouterService<any, Query>,
  ) {
  }

  @Post('command')
  handleCommand(@Body('command') command: Command): Promise<Command> {
    return this.commandService.handleCommand(command);
  }

  @Post('command/events')
  handleCommandAndGetEvents(@Body('command') command: CommandWithEvents): Promise<CommandWithEvents> {
    return this.commandService.handleCommandAndGetEvents(command);
  }

  @Post('query')
  handleQuery(@Body('query') query: Query): Promise<Query> {
    return this.queryService.handleQuery(query);
  }

  @Post('query/since')
  handleQuerySince(@Body('query') query: Query, @Body('sinceTimestamp') sinceTimestamp: pos_int): Promise<Query> {
    return this.queryService.handleQuerySince(query, sinceTimestamp);
  }

}
