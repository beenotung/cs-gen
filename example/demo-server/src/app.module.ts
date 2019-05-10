import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { LogModule } from 'cqrs-exp/dist/log/log.module';

@Module({
  imports: [CoreModule, LogModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
