import { Body, Controller, Post } from '@nestjs/common'
import { CoreService } from './core.service'
import { Call } from '../domain/calls'

@Controller('core')
export class CoreController {
  constructor(public coreService: CoreService) {}

  @Post('/Call')
  Call(@Body() call: Call) {
    let out = this.coreService.Call(call)
    return out
  }
}
