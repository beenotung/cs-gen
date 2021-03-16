import { Module } from '@nestjs/common'
import { CoreController } from './core.controller'
import { CoreService } from './core.service'
import { LogicalProcessor } from '../domain/logical-processor'

@Module({
  controllers: [CoreController],
  providers: [CoreService, LogicalProcessor],
})
export class CoreModule {}
