import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { PrismaService } from '../../database/prisma.service.js';
import { generateToken, hashToken } from '../../common/utils/crypto.utils.js';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TokenContext {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async issue(adminId: string, ctx: TokenContext = {}): Promise<IssuedTokens> {
    const accessToken = this.signAccessToken(adminId);
    const refreshToken = generateToken();

    await this.prisma.refreshToken.create({
      data: {
        adminId,
        tokenHash: hashToken(refreshToken),
        userAgent: ctx.userAgent,
        ipAddress: ctx.ipAddress,
        expiresAt: this.refreshExpiryDate(),
      },
    });

    return { accessToken, refreshToken };
  }

  async rotate(
    presentedRefreshToken: string | undefined,
    ctx: TokenContext = {},
  ): Promise<IssuedTokens> {
    if (!presentedRefreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(presentedRefreshToken) },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.revokedAt) {
      await this.revokeAllForAdmin(stored.adminId);
      throw new UnauthorizedException('Token reuse detected');
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issue(stored.adminId, ctx);
  }

  async revoke(presentedRefreshToken?: string): Promise<void> {
    if (!presentedRefreshToken) {
      return;
    }
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(presentedRefreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revokes every active refresh token for an admin.
   *
   * `exceptToken` keeps a single session alive - used when the password is
   * changed, so the session that made the request is not logged out.
   */
  async revokeAllForAdmin(
    adminId: string,
    exceptToken?: string,
  ): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        adminId,
        revokedAt: null,
        ...(exceptToken
          ? { tokenHash: { not: hashToken(exceptToken) } }
          : {}),
      },
      data: { revokedAt: new Date() },
    });
  }

  private signAccessToken(adminId: string): string {
    return this.jwtService.sign(
      { sub: adminId },
      {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: (this.configService.get<string>('jwt.accessExpiresIn') ??
          '15m') as StringValue,
      },
    );
  }

  private refreshExpiryDate(): Date {
    const expiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d';
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    const ms = match
      ? Number(match[1]) * multipliers[match[2]]
      : 7 * 86_400_000;
    return new Date(Date.now() + ms);
  }
}
