import { Module } from '@nestjs/common';
import { TypegooseModule } from 'nestjs-typegoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { cqrsEngine, DATABASE_URI } from './config/values';
import { CqrsController } from './cqrs/cqrs.controller';
import { MongooCqrsModule } from './impl/mongoo-cqrs/mongoo-cqrs.module';
import { CqrsEngine } from './lib/cqrs/types/api.types';

@Module({
  imports: [
    TypegooseModule.forRoot(DATABASE_URI, { useNewUrlParser: true }),
    MongooCqrsModule,
  ],
  providers: [
    AppService,
    {
      provide: CqrsEngine,
      useValue: cqrsEngine,
    },
  ],
  controllers: [AppController, CqrsController],
})
export class AppModule {}
