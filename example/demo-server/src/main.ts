import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { Server } from 'http';

const Primus = require('primus');
let primus;

let pfs: Array<(primus) => void> = [];

export function usePrimus(f: (primus) => void): void {
  if (primus) {
    f(primus);
    return;
  }
  pfs.push(f);
}

function attachServer(server: Server) {
  const primus_options = {
    pathname: "/primus",
    global: "Primus",
    parser: 'JSON',
    compression: true,
    transformer: 'engine.io',
  };

  primus = new Primus(server, primus_options);
  primus.plugin('emitter', require('primus-emitter'));
  // primus.save('primus.js');
  pfs.forEach(f => f(primus));

  primus.on('connection', spark => {
    console.log(spark.id, 'connected');
  });
}

async function bootstrap(port = 3000) {
  const app = await NestFactory.create(AppModule);
  attachServer(app.getHttpServer());
  await app.listen(port);
  console.log('listening on port ' + port);
}

bootstrap();
