import {
  Body,
  Controller,
  Post,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { CoreService } from './core.service'
import { Call, calls } from '../domain/calls'
import { LogService } from '../log/log.service'
import { status } from './status'

@Controller('core')
export class CoreController {
  callMetaMap = new Map(calls.map(call => [call.Type, call]))
  ready: true | Promise<true> = this.init()

  constructor(public coreService: CoreService, public logService: LogService) {
    this.init()
  }

  async init(): Promise<true> {
    status.isReplay = true
    await this.syncLogs()
    status.isReplay = false
    return (this.ready = true)
  }

  async syncLogs() {
    let keys = this.logService.getKeysSync()
    for (let key of keys) {
      let call = this.logService.getObjectSync<Call>(key)
      if (!call) continue
      let callMeta = this.callMetaMap.get(call.Type)
      if (!callMeta) continue
      let out = this.coreService.Call(call)
      if (callMeta.Async) {
        await out
      }
    }
  }

  storeAndCall(call: Call) {
    let callMeta = this.callMetaMap.get(call.Type)
    if (!callMeta) {
      throw new HttpException(
        `Unknown Call Type: ${call.Type}`,
        HttpStatus.NOT_IMPLEMENTED,
      )
    }
    call.In.Timestamp = Date.now()
    this.logService.storeObjectSync(this.logService.nextKey(call.Type), call)
    return this.coreService.Call(call)
  }

  @Post('/Call')
  Call(@Body() call: Call) {
    if (this.ready === true) {
      return this.storeAndCall(call)
    }
    return this.ready.then(() => this.storeAndCall(call))
  }
}
