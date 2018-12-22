import { Body, Controller, Post, Res } from '@nestjs/common';
import { rest_return } from 'nestlib';
import { cqrsEngine } from '../config/values';
import { Command, Query } from '../lib/cqrs/types';

@Controller('cqrs')
export class CqrsController {
  @Post('command')
  command(@Res() res, @Body() command: Command<any>): Promise<void> {
    return rest_return(res, cqrsEngine.fireCommand(command));
  }

  @Post('query')
  query(@Res() res, @Body() query: Query<any, any>): Promise<any> {
    return rest_return(res, cqrsEngine.query(query));
  }
}
