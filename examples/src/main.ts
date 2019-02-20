import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from './config/values';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(config.port, config.host);
  console.log('server listening on', config.baseUrl);
}

bootstrap();
