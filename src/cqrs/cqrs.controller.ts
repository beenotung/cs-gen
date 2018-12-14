import { Body, Controller, Post, Res } from '@nestjs/common';

@Controller('cqrs')
export class CqrsController {
  @Post('command')
  command(@Res() res, @Body() body) {}

  @Post('query')
  query(@Res() res, @Body() body) {}
}
