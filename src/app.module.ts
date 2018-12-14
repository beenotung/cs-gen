import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DATABASE_URI } from './config/values';
import { CqrsController } from './cqrs/cqrs.controller';
import { MongooCqrsModule } from './impl/mongoo-cqrs/mongoo-cqrs.module';

@Module({
  imports: [
    TypegooseModule.forRoot(DATABASE_URI, { useNewUrlParser: true }),
    MongooCqrsModule,
  ],
  controllers: [AppController, CqrsController],
  providers: [AppService],
})
export class AppModule {}
