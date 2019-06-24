import * as path from 'path';
import { Body, Controller, Post, Res } from '@nestjs/common';
import { Call } from '../domain/types';
import { CallInput, LogService } from 'cqrs-exp';
import { CoreService } from './core.service';
import { Bar } from 'cli-progress';
import { usePrimus } from '../main';
import { ok } from 'nestlib';
import { closeConnection, endSparkCall, newConnection, startSparkCall } from './connection';

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
      const call: CallInput<Call> = await this.logService.getObject<Call>(key);
      if(call.CallType !== 'Command'){
        continue;
      }
      this.coreService.Call(call);
      bar.increment(1);
    }
    bar.stop();
    usePrimus(primus => {
      primus.on('connection', spark => {
        newConnection(spark);
        spark.on('end', () => closeConnection(spark));
        spark.on('Call', async (call: CallInput<Call>, ack) => {
          startSparkCall(spark.id, call);
          try {
            await this.ready;
            await this.logService.storeObject(call);
            const out = this.coreService.Call<Call>(call);
            ack(out);
          } catch (e) {
            console.error(e);
            ack({
              error: e.toString(),
              response: e.response,
              status: e.status,
              message: e.message,
            });
          } finally {
            endSparkCall(spark.id, call);
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
    await this.logService.storeObject(body);
    try {
      const out = this.coreService.Call<C>(body);
      ok(res, out);
      return out;
    } catch (e) {
      return rest_return(res, Promise.reject(e));
    }
  }
}
