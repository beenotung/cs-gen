import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Server } from 'http';
import { Primus } from 'typestub-primus';

let primus: Primus;
const pfs: Array<(primus: Primus) => void> = [];

export function usePrimus(f: (primus: Primus) => void): void {
  if (primus) {
    f(primus);
    return;
  }
  pfs.push(f);
}

function attachServer(server: Server) {
  primus = new Primus(server, {
    pathname: "/primus",
    global: "Primus",
    parser: 'JSON',
    compression: true,
    transformer: 'engine.io',
  });
  primus.plugin('emitter', require('primus-emitter'));
  // primus.save('primus.js');
  pfs.forEach(f => f(primus));

  primus.on('connection', spark => {
    console.log(spark.id, 'connected');
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  attachServer(app.getHttpServer());
  await app.listen(3000);
  console.log('listening http and ws on port 3000');
}
bootstrap();
