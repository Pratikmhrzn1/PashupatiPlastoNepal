import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_SCOPE_KEY = 'rateLimitScope';

/**
 * Assigns a rate limiting scope to a route.
 *
 * The scope selects which `security.<scope>RateLimitLimit` /
 * `security.<scope>RateLimitTtl` configuration values apply.
 */
export const RateLimitScope = (scope: string) =>
  SetMetadata(RATE_LIMIT_SCOPE_KEY, scope);
