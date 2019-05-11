import { Module } from '@nestjs/common';
import { CoreService } from './core.service';
import { LogService } from 'cqrs-exp';
import * as path from 'path';
import { CoreController } from './core.controller';

@Module({
  controllers: [CoreController],
  providers: [CoreService, { provide: LogService, useValue: new LogService(path.join('data', 'log')) }],
})
export class CoreModule {
}
