import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from './config/values';

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(config.port, config.host);
  console.log('server listening on', config.baseUrl);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

bootstrap();
