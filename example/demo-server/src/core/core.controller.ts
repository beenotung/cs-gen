import * as path from 'path';
import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express-serve-static-core';
import { Call } from '../domain/types';
import { CallInput, LogService } from 'cqrs-exp';
import { CoreService } from './core.service';
import { Bar } from 'cli-progress';
import { ok, rest_return } from 'nestlib';
import { status } from './status';
import { endRestCall, startRestCall } from './connection';
import {
  closeConnection,
  endSparkCall,
  newConnection,
  Spark,
  startSparkCall,
} from './connection';
import { ISpark } from 'typestub-primus';
import { usePrimus } from '../main';

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
    status.isReplay = true;
    bar.start(keys.length, 0);
    for (const key of keys) {
      if (!key.endsWith('-Command')) {
        bar.increment(1);
        continue;
      }
      const call = await this.logService.getObject<CallInput<Call>>(key);
      if (call === null) {
        continue;
      }
      if (call.CallType !== 'Command') {
        bar.increment(1);
        continue;
      }
      try {
        this.coreService.Call(call);
      } catch (e) {
        console.error(`failed when call '${call.CallType}' '${call.Type}':`, e);
      }
      bar.increment(1);
    }
    status.isReplay = false;
    bar.stop();
    usePrimus(primus => {
      primus.on('connection', (_spark: ISpark) => {
        const spark: Spark = _spark as any;
        newConnection(spark);
        spark.on('end', () => closeConnection(spark));
        spark.on('Call', (async (call: CallInput<Call>, ack: (data: any) => void) => {
          call.In.Timestamp = Date.now();
          startSparkCall(spark, call);
          try {
            await this.ready;
            await this.logService.storeObject(call, this.logService.nextKey() + '-' + call.CallType);
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
            endSparkCall(spark, call);
          }
        }) as any);
      });
    });
  }

  storeAndCall<C extends Call>(
    call: CallInput<C>,
  ): C['Out'] {
    this.logService.storeObjectSync(
      call,
      this.logService.nextKey() + '-' + call.CallType,
    );
    return this.coreService.Call<C>(call);
  }

  @Post('Call')
  async Call<C extends Call>(
    @Req() req: Request,
    @Res() res: Response,
    @Body() call: CallInput<C>,
  ): Promise<C['Out']> {
    call.In.Timestamp = Date.now();
    await this.ready;
    try {
      startRestCall(req, res, call);
      const out = this.storeAndCall<C>(call);
      ok(res, out);
      return out;
    } catch (e) {
      return rest_return(res, Promise.reject(e));
    } finally {
      endRestCall(call);
    }
  }
}
