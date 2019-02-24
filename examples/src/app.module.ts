import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CqrsController, CqrsService } from 'cqrs-exp';
import { config } from './config/values';

@Module({
  imports: [],
  controllers: [AppController, CqrsController],
  providers: [
    AppService,
    {
      provide: CqrsService,
      useValue: config.cqrsService,
    },
  ],
})
export class AppModule {}
