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

/**
 * Routes the frontend calls with `VITE_API_BASE_URL` as the base URL.
 * They stay on the server root, everything else lives under `/api/v1`.
 */
export const PUBLIC_ROOT_ROUTES: { path: string; method: RequestMethod }[] = [
  { path: 'products', method: RequestMethod.GET },
  { path: 'products/featured', method: RequestMethod.GET },
  { path: 'products/:idOrSlug', method: RequestMethod.GET },
  { path: 'contacts', method: RequestMethod.POST },
];

export function configureApp(app: INestApplication): void {
  const apiPrefix = process.env.API_PREFIX || '/api/v1';
  const expressApp = app as NestExpressApplication;

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
    process.env.FRONTEND_URL || 'http://localhost:3000',
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
