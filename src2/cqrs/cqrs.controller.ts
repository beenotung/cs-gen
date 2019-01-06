import { Body, Controller, Post, Res } from '@nestjs/common';
import { rest_return } from 'nestlib';
import { CqrsEngine } from '../lib/cqrs/cqrs-engine';
import { _Query, Command } from '../lib/cqrs/types';

@Controller('cqrs')
export class CqrsController<C, E, Q, R, Query extends _Query<Q, R>> {
  constructor(public cqrsEngine: CqrsEngine<C, E, Q, R, Query>) {}

  @Post('command')
  fireCommand(@Res() res, @Body() command: Command<C>): Promise<void> {
    return rest_return(res, this.cqrsEngine.fireCommand(command));
  }

  @Post('query')
  query<iQ extends Q, iR extends R, iQuery extends Query & _Query<iQ, iR>>(
    @Res() res,
    @Body('query') query: iQuery,
  ): Promise<iR> {
    return rest_return(res, Promise.resolve(this.cqrsEngine.query(query)));
  }
}
