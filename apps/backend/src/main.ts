import './env.js';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { toNodeHandler } from 'better-auth/node';
import { AppModule } from './app.module.js';
import { auth, trustedOrigins } from './auth/auth.js';

async function bootstrap() {
  // The JSON parser is added by hand below, after Better Auth's routes: Better Auth reads the
  // raw request body itself and breaks if a parser has consumed it first.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });

  if (auth) app.getHttpAdapter().getInstance().all('/api/auth/{*any}', toNodeHandler(auth));

  // A campaign save grows with every logged week; the 100kb default would eventually reject it.
  app.useBodyParser('json', { limit: '1mb' });

  // The web app calls the API from its own origin, so only those origins are allowed cross-origin.
  app.enableCors({ origin: trustedOrigins, credentials: true });

  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`🚀 NestJS REST API is running on http://localhost:${port}/api/v1`);
}
bootstrap();
