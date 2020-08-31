import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common'
import { Bar } from 'cli-progress'
import { Request, Response } from 'express-serve-static-core'
import { bad_request, ok } from 'nestlib'
import { ISpark } from 'typestub-primus'
import { Call, CallInput } from '../domain/types'
import { iterateBatch } from '../lib/batch'
import { LogService } from '../lib/log.service'
import { isPromise, Result } from '../lib/result'
import { isInternalCall, shouldReply } from './calls'
import { endRestCall, startRestCall } from './connection'
import {
  closeConnection,
  endSparkCall,
  newConnection,
  Spark,
  startSparkCall,
} from './connection'
import { CoreService } from './core.service'
import { primusPromise } from './helpers'
import { instance } from './helpers'
import { status } from './status'

@Controller('core')
export class CoreController {
  constructor(public coreService: CoreService, public logService: LogService) {
    instance.storeAndCall = this.storeAndCall.bind(this)
    instance.ready = this.init()
  }

  async init() {
    await this.initSync()
    status.isReplay = false
    this.usePrimus()
  }

  storeAndCall<C extends Call>({
    call,
    from,
  }: {
    call: CallInput<C>
    from: 'server' | 'client'
  }): Result<C['Out']> {
    if (from !== 'server' && isInternalCall(call.Type)) {
      throw new HttpException(
        'The call is not from authentic caller',
        HttpStatus.FORBIDDEN,
      )
    }
    this.logService.storeObjectSync(
      call,
      this.logService.nextKey() + '-' + call.CallType,
    )
    return this.coreService.Call<C>(call)
  }

  @Post('Call')
  async Call<C extends Call>(
    @Req() req: Request,
    @Res() res: Response,
    @Body() call: CallInput<C>,
  ): Promise<C['Out']> {
    try {
      call.In.Timestamp = Date.now()
      await instance.ready
      startRestCall(req, res, call)
      let out = this.storeAndCall<C>({ call, from: 'client' })
      if (isPromise(out)) {
        out = await out
      }
      ok(res, out)
      return out
    } catch (e) {
      bad_request(res, e)
      return e
    } finally {
      endRestCall(call)
    }
  }

  private async initSync() {
    status.isReplay = true
    const start = Date.now()
    console.log('start init sync')
    const bar = new Bar({
      format:
        'init sync progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
    })
    bar.start(0, 0)
    for (const { key, content: call, estimateTotal } of iterateBatch<
      CallInput<Call>
    >(this.logService)) {
      bar.setTotal(estimateTotal)
      if (!key.endsWith('-Command')) {
        bar.increment(1)
        continue
      }
      if (call === null) {
        console.warn('failed to load call from log:', key)
        bar.increment(1)
        continue
      }
      if (!shouldReply(call.Type)) {
        bar.increment(1)
        continue
      }
      try {
        const out = this.coreService.Call(call)
        if (isPromise(out)) {
          await out
        }
      } catch (e) {
        console.error(`failed when call '${call.CallType}' '${call.Type}':`, e)
      }
      bar.increment(1)
    }
    bar.stop()
    console.log('finished init sync')
    const end = Date.now()
    console.log('used:', (end - start) / 1000, 'seconds')
  }

  private async usePrimus() {
    primusPromise.then(primus => {
      primus.on('connection', (_spark: ISpark) => {
        const spark: Spark = _spark as any
        newConnection(spark)
        spark.on('end', () => closeConnection(spark))
        spark.on('Call', (async (
          call: CallInput<Call>,
          ack: (data: any) => void,
        ) => {
          try {
            call.In.Timestamp = Date.now()
            await instance.ready
            startSparkCall(spark, call)
            let out = this.storeAndCall({ call, from: 'client' })
            if (isPromise(out)) {
              out = await out
            }
            ack(out)
          } catch (e) {
            console.error(e)
            ack({
              error: e.toString(),
              response: e.response,
              status: e.status,
              message: e.message,
            })
          } finally {
            endSparkCall(spark, call)
          }
        }) as any)
      })
      console.log('connected primus to CoreController')
    })
  }
}
