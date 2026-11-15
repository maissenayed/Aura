import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // A campaign save grows with every logged week; the 100kb default would eventually reject it.
  app.useBodyParser('json', { limit: '1mb' });
  app.enableCors({
    origin: true,
    credentials: true,
  });
  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`🚀 NestJS REST API is running on http://localhost:${port}/api/v1`);
}
bootstrap();
