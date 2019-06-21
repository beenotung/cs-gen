import * as path from 'path';
import { Body, Controller, Post, Res } from '@nestjs/common';
import { Call } from '../domain/types';
import { CallInput, LogService } from 'cqrs-exp';
import { CoreService } from './core.service';
import { Bar } from 'cli-progress';
import { usePrimus } from '../main';
import { ok } from 'nestlib';
import { closeConnection, newConnection } from './connection';

@Controller('core')
export class CoreController {
  logService: LogService;
  ready: Promise<void>;

  constructor(
    public coreService: CoreService,
  ) {
    this.logService = new LogService(path.join('data', 'log'));
    this.ready = this.restore();
  }

  async restore() {
    const keys = await this.logService.getKeys();
    const bar = new Bar({
      format: 'restore progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
    });
    bar.start(keys.length, 0);
    for (const key of keys) {
      const call = await this.logService.getObject<Call>(key);
      this.coreService.Call(call);
      bar.increment(1);
    }
    bar.stop();
    usePrimus(primus => {
      primus.on('connection', spark => {
        newConnection(spark);
        spark.on('end', () => closeConnection(spark));
        spark.on('Call', async (data: CallInput<Call>, ack) => {
          try {
            await this.ready;
            const out = this.coreService.Call<Call>(data);
            ack(out);
          } catch (e) {
            console.error(e);
            ack({
              error: e.toString(),
              response: e.response,
              status: e.status,
              message: e.message,
            });
          }
        });
      });
    });
  }

  @Post('Call')
  async Call<C extends Call>(
    @Res() res,
    @Body() body: CallInput,
  ): Promise<C['Out']> {
    await this.ready;
    this.logService.storeObject(body);
    const out = this.coreService.Call(body);
    return ok(res, out);
  }
}
