import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { apiConfig } from './domain/calls'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors()
  await app.listen(apiConfig.port)
}
bootstrap()
