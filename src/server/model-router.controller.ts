import { Body, Controller, Post } from '@nestjs/common';
import { ICqrsReadServer, ICqrsWriteServer, IEventStore } from '../core/cqrs.types';
import { ICommand, ICommandWithEvents, IEvent, IQuery } from '../core/data';
import { pos_int } from '../core/type';
import { CommandRouterService } from './command-router.service';
import { QueryRouterService } from './query-router.service';

@Controller('model')
export class ModelRouterController<Command extends ICommand<Command['command'], Command['result'], Command['type']>,
  CommandWithEvents extends ICommandWithEvents<CommandWithEvents['command'],
    CommandWithEvents['result'], Event['data'], CommandWithEvents['type'], Event['type']>,
  Event extends IEvent<Event['data'], Event['type']>,
  Query extends IQuery<Query['query'], Query['response'], Query['type']>,
  > implements ICqrsWriteServer<Command, CommandWithEvents, Event>, ICqrsReadServer<Query> {
  /**@deprecated*/
  eventStore: IEventStore = null;

  constructor(
    public commandService: CommandRouterService<any, Command, CommandWithEvents, Event>,
    public queryService: QueryRouterService<any, Event, Query>,
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
