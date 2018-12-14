import { Body, Controller, Post, Res } from '@nestjs/common';
import { rest_return } from 'nestlib';
import { cqrsEngine } from '../config/values';
import { Command, Query } from '../lib/cqrs/types/data.types';

@Controller('cqrs')
export class CqrsController {
  @Post('command')
  command(@Res() res, @Body() body: Command<any>) {
    return rest_return(res, cqrsEngine.fireCommand(body));
  }

  @Post('query')
  query(@Res() res, @Body() body: Query<any, any>) {
    return rest_return(res, cqrsEngine.query(body));
  }
}
