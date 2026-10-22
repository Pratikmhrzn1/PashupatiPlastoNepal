import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../database/prisma.service.js';

export interface JwtPayload {
  sub: string;
  iat?: number;
  exp?: number;
}

export function accessTokenExtractor(req: Request): string | null {
  const fromCookie = req?.cookies?.access_token;
  if (fromCookie) {
    return fromCookie;
  }
  const header = req?.headers?.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('jwt.accessSecret');
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not configured');
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([accessTokenExtractor]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, deletedAt: true },
    });

    if (!admin || admin.deletedAt) {
      throw new UnauthorizedException();
    }

    return { id: admin.id, email: admin.email, role: admin.role };
  }
}
