import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { Server } from 'http';

const Primus = require('primus');
export let primus;

function attachServer(server: Server) {
  const primus_options = {
    pathname: '/primus',
    parser: 'JSON',
    compression: true,
    transformer: 'engine.io',
  };

  primus = new Primus(server, primus_options);

  // /*
  primus.on('connection', spark => {
    console.log(spark.id, 'connected');
    spark.write('hi from server');
    spark.on('data', data => {
      console.log('client data:', data);
    });
  });
  // */
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  attachServer(app.getHttpServer());
  await app.listen(3000);
}

bootstrap();
