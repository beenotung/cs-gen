import { Module } from '@nestjs/common'
import { CoreController } from './core.controller'
import { CoreService } from './core.service'
import { LogicalProcessor } from '../domain/logical-processor'
import { LogModule } from '../log/log.module'

@Module({
  imports: [LogModule],
  controllers: [CoreController],
  providers: [CoreService, LogicalProcessor],
})
export class CoreModule {}
