import { Body, Controller, Post } from '@nestjs/common';
import { ICommand, IEvent, IQuery } from '../core/data';
import { SaveEventResult } from '../core/helper.types';
import { IReadModel } from '../core/interface';
import { pos_int } from '../core/type';
import { CqrsService } from './service';

@Controller('cqrs')
export class CqrsController<Command extends ICommand<Command['command'], Command['result'], Event, Command['type']>,
  Event extends IEvent<Event['data'], Event['type']>,
  Query extends IQuery<Query['query'], Query['response'], Query['type']>,
  > implements IReadModel<Event, Query> {

  constructor(public cqrsService: CqrsService<Command, Event, Query>) {
  }

  @Post('command')
  async command(@Body('command') command: Command): Promise<SaveEventResult<Event>> {
    return this.cqrsService.command(command);
  }

  @Post('query')
  query(@Body('query') query: Query): Promise<Query['response']> {
    return this.cqrsService.query(query);
  }

  @Post('query')
  querySince(@Body('query') query: Query, @Body('sinceTimestamp') sinceTimestamp: pos_int): Promise<Query['response']> {
    return this.cqrsService.querySince(query, sinceTimestamp);
  }
}
