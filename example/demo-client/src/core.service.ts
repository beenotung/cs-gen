import { Body, Controller, injectNestClient, Post } from 'nest-client';
import { Call } from './lib';


@Controller('core')
export class CoreProvider {
  constructor() {
    injectNestClient(this, {
      baseUrl: 'http://localhost:3000',
    });
  }

  @Post('call')
  async call<C extends Call>(@Body()body: { Type: C['Type'], In: C['In'] }): Promise<{ Out: C['Out'] }> {
    return undefined;
  }
}
