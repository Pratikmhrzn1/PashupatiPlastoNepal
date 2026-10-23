import {
  INestApplication,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { join } from 'node:path';
import { AllExceptionsFilter } from './common/filters/http-exception.filter.js';
import { resolveFrontendUrl } from './config/runtime-urls.js';

/**
 * Routes the frontend calls are under /api (routed by Vercel Services). Everything else lives under `/api/v1`.
 */
export const PUBLIC_ROOT_ROUTES: { path: string; method: RequestMethod }[] = [
  { path: 'api/products', method: RequestMethod.GET },
  { path: 'api/products/featured', method: RequestMethod.GET },
  { path: 'api/products/:idOrSlug', method: RequestMethod.GET },
  { path: 'api/contacts', method: RequestMethod.POST },
];

export function configureApp(app: INestApplication): void {
  const apiPrefix = process.env.API_PREFIX || '/api/v1';
  const expressApp = app as NestExpressApplication;

  // Vercel terminates TLS and proxies requests, so trust its forwarded headers
  // for correct client IPs (rate limiting) and protocol detection.
  expressApp.set('trust proxy', 1);

  app.setGlobalPrefix(apiPrefix, { exclude: PUBLIC_ROOT_ROUTES });
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(compression());
  app.use(cookieParser());

  expressApp.useBodyParser('json', { limit: '8mb' });
  expressApp.useBodyParser('urlencoded', { extended: true, limit: '8mb' });
  expressApp.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    maxAge: 604_800_000,
  });

  const allowedOrigins = [
    resolveFrontendUrl(),
    ...(process.env.CORS_ORIGINS?.split(',') ?? []),
  ]
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      // Allow same-origin and non-browser requests (curl, health checks).
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('PashupatiPlasto API')
    .setDescription('Marketing and contact website API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, config),
  );
}
