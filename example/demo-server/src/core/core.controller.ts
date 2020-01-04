import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { Bar } from 'cli-progress';
import { Request, Response } from 'express-serve-static-core';
import { ok, rest_return } from 'nestlib';
import * as path from 'path';
import { ISpark } from 'typestub-primus';
import { Call, CallInput } from '../domain/types';
import { LogService } from '../lib/log.service';
import { iterateSnapshot } from '../lib/snapshot';
import { usePrimus } from '../main';
import { endRestCall, startRestCall } from './connection';
import {
  closeConnection,
  endSparkCall,
  newConnection,
  Spark,
  startSparkCall,
} from './connection';
import { CoreService } from './core.service';
import { status } from './status';

let ready: Promise<void>;

@Controller('core')
export class CoreController {

  constructor(
    public coreService: CoreService,
    public logService: LogService,
  ) {
    ready = this.restore();
  }

  async restore() {
    const start = Date.now();
    console.log('start to restore');
    // const keys = this.logService.getKeysSync();
    const bar = new Bar({
      format: 'restore progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
    });
    status.isReplay = true;
    // bar.start(keys.length, 0);
    // for (const key of keys) {
    bar.start(0, 0);
    for (const { key, content, estimateTotal } of iterateSnapshot<
      CallInput<Call>
    >(this.logService)) {
      bar.setTotal(estimateTotal);
      if (!key.endsWith('-Command')) {
        bar.increment(1);
        continue;
      }
      // const call = this.logService.getObjectSync<CallInput<Call>>(key);
      const call = content();
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
    console.log('finished restore');
    const end = Date.now();
    console.log('used:', (end - start) / 1000, 'seconds');
    usePrimus(primus => {
      primus.on('connection', (_spark: ISpark) => {
        const spark: Spark = _spark as any;
        newConnection(spark);
        spark.on('end', () => closeConnection(spark));
        spark.on('Call', (async (call: CallInput<Call>, ack: (data: any) => void) => {
          call.In.Timestamp = Date.now();
          startSparkCall(spark, call);
          try {
            await ready;
            let out = this.storeAndCall(call);
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

  storeAndCall<C extends Call>(call: CallInput<C>): C['Out'] {
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
    await ready;
    try {
      startRestCall(req, res, call);
      let out = this.storeAndCall<C>(call);
      ok(res, out);
      return out;
    } catch (e) {
      return rest_return(res, Promise.reject(e));
    } finally {
      endRestCall(call);
    }
  }
}
