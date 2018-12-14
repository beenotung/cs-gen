import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CqrsController } from './cqrs/cqrs.controller';

@Module({
  imports: [],
  providers: [
    AppService,
  ],
  controllers: [AppController, CqrsController],
})
export class AppModule {
}
