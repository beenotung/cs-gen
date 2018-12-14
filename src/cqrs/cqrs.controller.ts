import { Body, Controller, Post, Res } from '@nestjs/common';
import { Command, Query } from '../lib/cqrs/types';
import { rest_return } from 'nestlib';

@Controller('cqrs')
export class CqrsController {
  @Post('command')
  command(@Res()res, @Body()command: Command<any>) {
    return rest_return();
  }

  @Post('query')
  query(@Res()res, @Body()query: Query<any>) {
  }
}
