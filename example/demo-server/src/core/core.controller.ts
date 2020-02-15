import { Body, Controller, Post, Req, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Bar } from 'cli-progress';
import { Request, Response } from 'express-serve-static-core';
import { bad_request, ok } from 'nestlib';
import { ISpark } from 'typestub-primus';
import { Call, CallInput } from '../domain/types';
import { LogService } from '../lib/log.service';
import { isInternalCall } from './calls';
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

@Controller('core')
export class CoreController {

  constructor(
    public coreService: CoreService,
    public logService: LogService,
  ) {
    this.init();
  }

  private initSync() {
    status.isReplay = true;
    const start = Date.now();
    console.log('start init sync');
    const bar = new Bar({
      format:
        'init sync progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
    });
    bar.start(0, 0);
    for (const { key, content, estimateTotal } of iterateSnapshot<
      CallInput<Call>
    >(this.logService)) {
      bar.setTotal(estimateTotal);
      if (!key.endsWith('-Command')) {
        bar.increment(1);
        continue;
      }
      const call = content();
      if (call === null) {
        console.warn('failed to load call from log:', key);
        bar.increment(1);
        continue;
      }
      if (call.CallType !== "Command") {
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
    bar.stop();
    console.log('finished init sync');
    const end = Date.now();
    console.log('used:', (end - start) / 1000, 'seconds');
  }

  private usePrimus() {
    usePrimus(primus => {
      primus.on('connection', (_spark: ISpark) => {
        const spark: Spark = _spark as any;
        newConnection(spark);
        spark.on('end', () => closeConnection(spark));
        spark.on('Call', ((call: CallInput<Call>, ack: (data: any) => void) => {
          call.In.Timestamp = Date.now();
          startSparkCall(spark, call);
          try {
            let out = this.storeAndCall({ call, from: 'client' });
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
    console.log('connected primus to CoreController');
  }

  init() {
    this.initSync();
    status.isReplay = false;
    this.usePrimus();
  }

  storeAndCall<C extends Call>({ call, from }: { call: CallInput<C>, from: 'server' | 'client' }): C['Out'] {
    if (from !== 'server' && isInternalCall(call.Type)) {
      throw new HttpException('The call is not from authentic caller', HttpStatus.FORBIDDEN);
    }
    this.logService.storeObjectSync(
      call,
      this.logService.nextKey() + '-' + call.CallType,
    );
    return this.coreService.Call<C>(call);
  }

  @Post('Call')
  Call<C extends Call>(
    @Req() req: Request,
    @Res() res: Response,
    @Body() call: CallInput<C>,
  ): C['Out'] {
    call.In.Timestamp = Date.now();
    try {
      startRestCall(req, res, call);
      let out = this.storeAndCall<C>({ call, from: 'client' });
      ok(res, out);
      return out;
    } catch (e) {
      bad_request(res, e);
      return e;
    } finally {
      endRestCall(call);
    }
  }
}
