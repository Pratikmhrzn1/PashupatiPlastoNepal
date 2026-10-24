import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });
  const logger = app.get(Logger);
  app.useLogger(logger);

  configureApp(app);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}${process.env.API_PREFIX || '/api/v1'}`);
}

bootstrap().catch((err) => {
  // Ensure fatal startup crashes are logged with full stack traces in production (e.g. Vercel)
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
