import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooCqrsModule } from './impl/mongoo-cqrs/mongoo-cqrs.module';

@Module({
  imports: [MongooCqrsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
