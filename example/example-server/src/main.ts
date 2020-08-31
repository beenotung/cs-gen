import { NestFactory } from '@nestjs/core'
import { Server } from 'http'
import { Primus } from 'typestub-primus'
import { AppModule } from './app.module'
import { resolvePrimus } from './core/helpers'

function attachServer(server: Server) {
  const primus = new Primus(server, {
    pathname: '/primus',
    global: 'Primus',
    parser: 'JSON',
    compression: true,
    transformer: 'engine.io',
  })
  primus.plugin('emitter', require('primus-emitter'))
  // primus.save('primus.js');

  primus.on('connection', spark => {
    console.log(spark.id, 'connected')
  })

  resolvePrimus(primus)
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors()
  attachServer(app.getHttpServer())
  await app.listen(3000)
  console.log('listening http and ws on port 3000')
}
bootstrap()
