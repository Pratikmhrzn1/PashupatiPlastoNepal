import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service.js';
import { verifyPassword } from '../../common/utils/crypto.utils.js';
import { LoginDto } from './dto/login.dto.js';
import { TokenService } from './token.service.js';

const INVALID_CREDENTIALS = 'Invalid email or password';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto, ctx: { userAgent?: string; ipAddress?: string }) {
    const admin = await this.prisma.admin.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!admin || admin.deletedAt) {
      // Burn comparable time so a missing account is not detectable by timing.
      await verifyPassword(
        '$argon2id$v=19$m=65536,t=3,p=4$Y2FuYXJ5c2FsdGNhbmFyeQ$0000000000000000000000000000000000000000000',
        dto.password,
      );
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    if (admin.lockedUntil && admin.lockedUntil.getTime() > Date.now()) {
      throw new UnauthorizedException(
        'Account locked due to too many failed attempts. Try again later.',
      );
    }

    const isValid = await verifyPassword(admin.passwordHash, dto.password);
    if (!isValid) {
      await this.registerFailedAttempt(admin.id, admin.failedLoginAttempts);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const tokens = await this.tokenService.issue(admin.id, ctx);

    return {
      admin: { id: admin.id, email: admin.email, role: admin.role },
      ...tokens,
    };
  }

  async me(adminId: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!admin) {
      throw new UnauthorizedException();
    }

    return admin;
  }

  private async registerFailedAttempt(
    adminId: string,
    previousAttempts: number,
  ): Promise<void> {
    const maxAttempts = this.configService.get<number>('security.maxLoginAttempts') ?? 5;
    const lockoutMs =
      this.configService.get<number>('security.lockoutDurationMs') ?? 15 * 60_000;
    const attempts = previousAttempts + 1;

    await this.prisma.admin.update({
      where: { id: adminId },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil:
          attempts >= maxAttempts ? new Date(Date.now() + lockoutMs) : null,
      },
    });
  }
}
