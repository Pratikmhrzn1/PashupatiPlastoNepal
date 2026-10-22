import {
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ThrottlerStorage } from '@nestjs/throttler';
import { RateLimitGuard } from './rate-limit.guard.js';
import { RATE_LIMIT_SCOPE_KEY } from '../decorators/rate-limit-scope.decorator.js';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let storage: { increment: ReturnType<typeof vi.fn> };
  let reflector: { getAllAndOverride: ReturnType<typeof vi.fn> };
  let config: Record<string, number>;

  const buildContext = (ip = '127.0.0.1') => {
    const request = { ip, socket: { remoteAddress: ip } };
    const response = { setHeader: vi.fn() };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
      getHandler: () => 'handler',
      getClass: () => 'class',
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    storage = {
      increment: vi.fn().mockResolvedValue({
        isBlocked: false,
        timeToBlockExpire: 0,
        totalHits: 1,
        timeToExpire: 60_000,
      }),
    };
    reflector = {
      getAllAndOverride: vi.fn().mockReturnValue('auth'),
    };
    config = {
      'security.authRateLimitLimit': 5,
      'security.authRateLimitTtl': 60_000,
      'security.passwordRateLimitLimit': 3,
      'security.passwordRateLimitTtl': 900_000,
      'security.verificationRateLimitLimit': 5,
      'security.verificationRateLimitTtl': 900_000,
    };

    guard = new RateLimitGuard(
      storage as unknown as ThrottlerStorage,
      { get: (key: string) => config[key] } as unknown as ConfigService,
      reflector as unknown as Reflector,
    );
  });

  it('allows the request when the limit is not exceeded', async () => {
    await expect(guard.canActivate(buildContext())).resolves.toBe(true);
  });

  it('uses the scope from the route metadata', async () => {
    reflector.getAllAndOverride.mockReturnValue('password');

    await guard.canActivate(buildContext());

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      RATE_LIMIT_SCOPE_KEY,
      expect.any(Array),
    );
    expect(storage.increment).toHaveBeenCalledWith(
      'rate-limit:password:127.0.0.1',
      900_000,
      3,
      900_000,
      'password',
    );
  });

  it('falls back to the auth scope when no scope is declared', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    await guard.canActivate(buildContext());

    expect(storage.increment).toHaveBeenCalledWith(
      'rate-limit:auth:127.0.0.1',
      60_000,
      5,
      60_000,
      'auth',
    );
  });

  it('tracks each client address separately', async () => {
    await guard.canActivate(buildContext('10.0.0.1'));
    await guard.canActivate(buildContext('10.0.0.2'));

    expect(storage.increment).toHaveBeenNthCalledWith(
      1,
      'rate-limit:auth:10.0.0.1',
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      'auth',
    );
    expect(storage.increment).toHaveBeenNthCalledWith(
      2,
      'rate-limit:auth:10.0.0.2',
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      'auth',
    );
  });

  it('throws 429 when the limit is exceeded', async () => {
    storage.increment.mockResolvedValue({
      isBlocked: true,
      timeToBlockExpire: 30_000,
      totalHits: 6,
      timeToExpire: 60_000,
    });

    await expect(guard.canActivate(buildContext())).rejects.toThrow(
      HttpException,
    );

    try {
      await guard.canActivate(buildContext());
    } catch (error) {
      expect((error as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  });

  it('sets the Retry-After header', async () => {
    storage.increment.mockResolvedValue({
      isBlocked: false,
      timeToBlockExpire: 30_000,
      totalHits: 1,
      timeToExpire: 60_000,
    });

    const context = buildContext();
    await guard.canActivate(context);

    const response = context.switchToHttp().getResponse() as unknown as {
      setHeader: ReturnType<typeof vi.fn>;
    };

    expect(response.setHeader).toHaveBeenCalledWith('Retry-After', 30);
  });
});
