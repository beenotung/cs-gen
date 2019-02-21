import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  CommandRouterService,
  ModelRouterController,
  QueryRouterService,
} from 'cqrs-exp';
import { config } from './config/values';

@Module({
  imports: [],
  controllers: [AppController, ModelRouterController],
  providers: [
    AppService,
    {
      provide: CommandRouterService,
      useValue: config.commandRouterService,
    },
    {
      provide: QueryRouterService,
      useValue: config.queryRouterService,
    },
  ],
})
export class AppModule {}
