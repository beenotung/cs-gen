import * as path from 'path';
import { Body, Controller, Post } from '@nestjs/common';
import { Call } from '../domain/types';
import { Db, EventSelector, LogService } from 'cqrs-exp';
import { CoreService } from './core.service';
import { Bar } from 'cli-progress';

@Controller('core')
export class CoreController {
  logService: LogService;

  // db: Db;

  ready: Promise<void>;

  constructor(
    public coreService: CoreService,
  ) {
    this.logService = new LogService(path.join('data', 'log'));
    // this.db = new Db({ connectionOptions: { host: 'localhost' } });
    this.ready = this.restore();
  }

  async restore() {
    /*
    if ('dev') {
      let selector: EventSelector = { aggregate_id: 'core' };
      const n = await this.db.getEventsCount(selector);
      const bar = new Bar({
        format: 'restore progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
      });
      bar.start(n, 0);
      let cursor = await this.db.subEvents(selector);
      let i = 0;
      cursor.each((err, row) => {
        if (err) {
          console.error('failed to subscribe event:', err);
          return;
        }
        i++;
        if (i === n) {
          bar.stop();
        }
      });
      if (n === 0) {
        bar.stop();
      }
      return
    }
    */
    const keys = await this.logService.getKeys();
    const bar = new Bar({
      format: 'restore progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
    });
    bar.start(keys.length, 0);
    for (const key of keys) {
      const call = await this.logService.getObject<Call>(key);
      this.coreService.Call(call.Type)(call.In);
      bar.increment(1);
    }
    bar.stop();
  }

  @Post('call')
  async call<C extends Call>(@Body()body: { Type: C['Type'], In: C['In'] }): Promise<{ Out: C['Out'] }> {
    await this.ready;
    this.logService.storeObject(body);
    const out = this.coreService.Call(body.Type)(body.In);
    return Promise.resolve(out).then(Out => ({ Out }));
  }
}
