import { Call } from '../../demo-server/src/domain/types';
import { Body, Controller, injectNestClient, Post, setBaseUrl } from 'nest-client';
import { CallInput } from 'cqrs-exp/dist/utils';

@Controller('core')
export class CoreService {
  constructor(baseUrl: string) {
    setBaseUrl(baseUrl);
    injectNestClient(this);
  }

  @Post('Call')
  async Call<C extends Call>(
    @Body() body: CallInput,
  ): Promise<C['Out']> {
    return undefined;
  }
}
