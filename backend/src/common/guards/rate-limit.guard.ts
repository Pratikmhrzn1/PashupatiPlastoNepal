import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ThrottlerStorage } from '@nestjs/throttler';
import type { Request } from 'express';
import { RATE_LIMIT_SCOPE_KEY } from '../decorators/rate-limit-scope.decorator.js';

export const DEFAULT_RATE_LIMIT_SCOPE = 'auth';

/**
 * Per-route rate limiting that reads its limits from configuration at request
 * time. The built-in `@Throttle` decorator takes static values, which would
 * make the limits impossible to tune per environment.
 *
 * Each route picks a scope via `@RateLimitScope('password')`; the scope selects
 * the `security.<scope>RateLimitLimit` / `security.<scope>RateLimitTtl`
 * configuration values.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    // `ThrottlerStorage` is a token, not a class, so it has to be injected
    // explicitly - it cannot be recovered from the emitted design:paramtypes.
    @Inject(ThrottlerStorage)
    private readonly storage: ThrottlerStorage,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const scope =
      this.reflector.getAllAndOverride<string>(RATE_LIMIT_SCOPE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? DEFAULT_RATE_LIMIT_SCOPE;

    const request = context.switchToHttp().getRequest<Request>();
    const tracker = request.ip ?? request.socket?.remoteAddress ?? 'unknown';

    const limit =
      this.configService.get<number>(`security.${scope}RateLimitLimit`) ?? 5;
    const ttl =
      this.configService.get<number>(`security.${scope}RateLimitTtl`) ?? 60_000;

    const key = `rate-limit:${scope}:${tracker}`;
    const { isBlocked, timeToBlockExpire } = await this.storage.increment(
      key,
      ttl,
      limit,
      ttl,
      scope,
    );

    if (isBlocked) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: 'Too many requests, please try again later.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const response = context.switchToHttp().getResponse();
    response?.setHeader?.('Retry-After', Math.ceil(timeToBlockExpire / 1000));

    return true;
  }
}
