import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AppConfigModule } from './config/config.module.js';
import { DatabaseModule } from './database/prisma.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { AdminsModule } from './modules/admins/admins.module.js';
import { MailModule } from './modules/mail/mail.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          name: 'default',
          ttl: configService.get<number>('rateLimit.ttl') ?? 60_000,
          limit: configService.get<number>('rateLimit.limit') ?? 100,
        },
      ],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        namespace: configService.get<string>('cache.namespace') ?? 'pashupati',
        ttl:
          (configService.get<number>('cache.productListTtlSeconds') ?? 60) *
          1000,
      }),
    }),
    HealthModule,
    MailModule,
    AuthModule,
    AdminsModule,
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
