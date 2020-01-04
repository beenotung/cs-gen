import { Module } from '@nestjs/common';
import * as path from 'path';
import { LogService } from '../lib/log.service';
import { CoreController } from './core.controller';
import { CoreService } from './core.service';

@Module({
  controllers: [CoreController],
  providers: [
    CoreService,
    { provide: LogService, useValue: new LogService(path.join('data', 'log')) },
  ],
})
export class CoreModule {
}
