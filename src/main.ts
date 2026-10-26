import { NestFactory } from '@nestjs/core';
import type { Express, Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // La API vive bajo /api. La raíz se registra directo en Express (fuera del
  // router de Nest) para no responder 404 al abrir la URL base del deploy.
  const server = app.getHttpAdapter().getInstance() as Express;
  server.get('/', (_req: Request, res: Response) => {
    res.json({
      service: 'bita-api',
      status: 'ok',
      message: 'BITA API is online',
      api: '/api',
      health: '/api/health',
      timestamp: new Date().toISOString(),
    });
  });

  app.setGlobalPrefix('api');

  const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  });

  app.enableShutdownHooks();

  await app.listen(Number(process.env.PORT ?? 3000), '0.0.0.0');
}
bootstrap();
