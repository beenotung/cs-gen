import { Body, Controller, Post } from '@nestjs/common';
import { Call } from '../domain/types';
import { LogService } from 'cqrs-exp';
import { CoreService } from './core.service';
import * as path from 'path';
import { Bar } from 'cli-progress';

@Controller('core')
export class CoreController {
  logService: LogService;

  constructor(
    public coreService: CoreService,
  ) {
    this.logService = new LogService(path.join('data', 'log'));
    this.restore();
  }

  restore() {
    const keys = this.logService.getKeysSync();
    const bar = new Bar({
      format: 'restore progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
    });
    bar.start(keys.length, 0);
    for (const key of keys) {
      const call = this.logService.getObject<Call>(key);
      this.coreService.Call(call.Type)(call.In);
      bar.increment(1);
    }
    bar.stop();
  }

  @Post('call')
  async call<C extends Call>(@Body()body: { Type: C['Type'], In: C['In'] }): Promise<{ Out: C['Out'] }> {
    this.logService.storeObject(body);
    const out = this.coreService.Call(body.Type)(body.In);
    return Promise.resolve(out).then(Out => ({ Out }));
  }
}
