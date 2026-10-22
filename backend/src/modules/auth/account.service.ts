import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service.js';
import { MailService } from '../mail/mail.service.js';
import { TokenService } from './token.service.js';
import {
  generateToken,
  hashPassword,
  hashToken,
  verifyPassword,
} from '../../common/utils/crypto.utils.js';
import { emailVerificationTemplate } from '../mail/templates/email-verification.template.js';
import { passwordResetTemplate } from '../mail/templates/password-reset.template.js';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Issues an email verification token and sends the verification email.
   *
   * Any previously issued but unused tokens are invalidated first so only the
   * newest link works.
   */
  async requestEmailVerification(adminId: string): Promise<void> {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        deletedAt: true,
      },
    });

    if (!admin || admin.deletedAt) {
      throw new UnauthorizedException();
    }

    if (admin.emailVerified) {
      throw new BadRequestException('Email address is already verified');
    }

    const ttlHours =
      this.configService.get<number>('security.emailVerificationTtlHours') ?? 24;
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    await this.prisma.emailVerificationToken.updateMany({
      where: { adminId, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = generateToken();
    await this.prisma.emailVerificationToken.create({
      data: {
        adminId,
        tokenHash: hashToken(token),
        expiresAt,
      },
    });

    const verificationUrl = this.buildUrl('/verify-email', token);
    const template = emailVerificationTemplate({
      adminEmail: admin.email,
      verificationUrl,
      expiresInHours: ttlHours,
    });

    await this.deliver({
      to: admin.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /** Consumes a verification token and marks the admin as verified. */
  async verifyEmail(token: string): Promise<{ email: string }> {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { id: true, adminId: true, expiresAt: true, usedAt: true },
    });

    if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.admin.update({
        where: { id: record.adminId },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      }),
    ]);

    const admin = await this.prisma.admin.findUnique({
      where: { id: record.adminId },
      select: { email: true },
    });

    return { email: admin?.email ?? '' };
  }

  /**
   * Starts a password reset.
   *
   * The response is identical whether or not the address is registered, so the
   * endpoint cannot be used to enumerate accounts.
   */
  async forgotPassword(email: string): Promise<void> {
    const admin = await this.prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, deletedAt: true },
    });

    if (!admin || admin.deletedAt) {
      this.logger.debug(`Password reset requested for an unknown address`);
      return;
    }

    const ttlMinutes =
      this.configService.get<number>('security.passwordResetTtlMinutes') ?? 60;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.prisma.passwordResetToken.updateMany({
      where: { adminId: admin.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = generateToken();
    await this.prisma.passwordResetToken.create({
      data: {
        adminId: admin.id,
        tokenHash: hashToken(token),
        expiresAt,
      },
    });

    const resetUrl = this.buildUrl('/reset-password', token);
    const template = passwordResetTemplate({
      adminEmail: admin.email,
      resetUrl,
      expiresInMinutes: ttlMinutes,
    });

    await this.deliver({
      to: admin.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Consumes a reset token, sets the new password and invalidates every
   * session so a stolen refresh token cannot outlive the reset.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { id: true, adminId: true, expiresAt: true, usedAt: true },
    });

    if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await hashPassword(newPassword);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.admin.update({
        where: { id: record.adminId },
        data: {
          passwordHash,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
    ]);

    await this.tokenService.revokeAllForAdmin(record.adminId);
  }

  /**
   * Changes the password of an authenticated admin.
   *
   * The current password is required, and every other session is revoked.
   * `currentRefreshToken` keeps the session that made the request alive.
   */
  async changePassword(
    adminId: string,
    currentPassword: string,
    newPassword: string,
    currentRefreshToken?: string,
  ): Promise<void> {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, passwordHash: true },
    });

    if (!admin) {
      throw new UnauthorizedException();
    }

    const isValid = await verifyPassword(admin.passwordHash, currentPassword);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await hashPassword(newPassword);

    await this.prisma.admin.update({
      where: { id: adminId },
      data: { passwordHash },
    });

    await this.tokenService.revokeAllForAdmin(adminId, currentRefreshToken);
  }

  private buildUrl(path: string, token: string): string {
    const baseUrl =
      this.configService.get<string>('frontendUrl') ?? 'http://localhost:3000';
    return `${baseUrl.replace(/\/$/, '')}${path}?token=${encodeURIComponent(token)}`;
  }

  /**
   * Sends a message, swallowing delivery failures.
   *
   * A mail outage must not turn a forgot-password request into an error, and
   * it must never leak the token through an error response.
   */
  private async deliver(message: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    try {
      const result = await this.mailService.send(message);
      this.logger.log(`Mail sent via ${result.provider} to ${message.to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send "${message.subject}" to ${message.to}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
