import { NestFactory } from '@nestjs/core';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { DatabaseExceptionFilter } from './shop/database.filter.js';

export async function createApplication() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger: process.env.NODE_ENV === 'test' ? false : ['error', 'warn', 'log'],
  });
  return configureApplication(app);
}
export function configureApplication(app: INestApplication) {
  const origins = (process.env.CLIENT_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim());
  app.use(helmet());
  app.enableCors({ origin: origins, credentials: true });
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      req.headers.origin &&
      !origins.includes(req.headers.origin)
    ) {
      res
        .status(403)
        .json({ message: 'This request origin is not permitted.' });
      return;
    }
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new DatabaseExceptionFilter());
  app.enableShutdownHooks();
  return app;
}
