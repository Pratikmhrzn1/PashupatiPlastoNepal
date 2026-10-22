import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { REFRESH_TOKEN_COOKIE } from '../constants/auth.constants.js';

/**
 * Refresh tokens are opaque, hashed values stored in the database rather than
 * JWTs, so this guard only extracts the cookie. All validation (existence,
 * revocation, expiry, reuse detection) happens against the database in
 * `TokenService.rotate`.
 */
@Injectable()
export class RefreshTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    (request as Request & { refreshToken?: string }).refreshToken =
      request.cookies?.[REFRESH_TOKEN_COOKIE];

    return true;
  }
}
