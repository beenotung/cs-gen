import { Body, Controller, Post } from '@nestjs/common';
import { Call } from '../domain/types';
import { LogService } from 'cqrs-exp';
import { CoreService } from './core.service';

@Controller('core')
export class CoreController {
  constructor(
    public logService: LogService,
    public coreService: CoreService,
  ) {
    this.restore();
  }

  restore() {
    const keys = this.logService.getKeysSync();
    for (const key of keys) {
      const call = this.logService.getObject<Call>(key);
      this.coreService.Call(call.Type)(call.In);
    }
  }

  @Post('call')
  async call<C extends Call>(@Body()body: { Type: C['Type'], In: C['In'] }): Promise<{ Out: C['Out'] }> {
    this.logService.storeObject(body);
    const out = this.coreService.Call(body.Type)(body.In);
    return Promise.resolve(out).then(Out => ({ Out }));
  }
}
