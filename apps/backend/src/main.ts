import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });
  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`🚀 NestJS REST API is running on http://localhost:${port}/api/v1`);
}
bootstrap();
