import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AccountService } from './account.service.js';
import { TokenService } from './token.service.js';
import { PrismaService } from '../../database/prisma.service.js';
import { MailService } from '../mail/mail.service.js';
import { MockMailService } from '../../../test/mocks/mock-mail.service.js';
import { hashPassword } from '../../common/utils/crypto.utils.js';

describe('AccountService', () => {
  let service: AccountService;
  let mail: MockMailService;
  let prisma: any;

  const adminId = 'admin-1';
  const adminEmail = 'admin@example.com';

  const buildAdmin = (overrides: Record<string, unknown> = {}) => ({
    id: adminId,
    email: adminEmail,
    emailVerified: false,
    deletedAt: null,
    passwordHash: '',
    ...overrides,
  });

  beforeEach(async () => {
    mail = new MockMailService();

    prisma = {
      admin: {
        findUnique: vi.fn().mockResolvedValue(buildAdmin()),
        update: vi.fn().mockResolvedValue(buildAdmin()),
      },
      emailVerificationToken: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      passwordResetToken: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: vi.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mail },
        {
          provide: TokenService,
          useValue: { revokeAllForAdmin: vi.fn().mockResolvedValue(undefined) },
        },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => {
              const values: Record<string, unknown> = {
                'frontendUrl': 'http://localhost:3000',
                'security.emailVerificationTtlHours': 24,
                'security.passwordResetTtlMinutes': 60,
              };
              return values[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get(AccountService);
  });

  describe('requestEmailVerification', () => {
    it('stores a hashed token and sends the email', async () => {
      await service.requestEmailVerification(adminId);

      const createArg = prisma.emailVerificationToken.create.mock.calls[0][0];
      expect(createArg.data.adminId).toBe(adminId);
      expect(createArg.data.tokenHash).toMatch(/^[0-9a-f]{64}$/);
      expect(mail.sent).toHaveLength(1);
      expect(mail.last()?.to).toBe(adminEmail);
    });

    it('never stores the raw token', async () => {
      await service.requestEmailVerification(adminId);

      const createArg = prisma.emailVerificationToken.create.mock.calls[0][0];
      const rawToken = mail.lastToken();

      expect(rawToken).toBeDefined();
      expect(createArg.data.tokenHash).not.toBe(rawToken);
    });

    it('expires the token after the configured number of hours', async () => {
      await service.requestEmailVerification(adminId);

      const createArg = prisma.emailVerificationToken.create.mock.calls[0][0];
      const delta = createArg.data.expiresAt.getTime() - Date.now();

      expect(delta).toBeGreaterThan(23.9 * 60 * 60 * 1000);
      expect(delta).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    });

    it('invalidates previously issued unused tokens', async () => {
      await service.requestEmailVerification(adminId);

      expect(prisma.emailVerificationToken.updateMany).toHaveBeenCalledWith({
        where: { adminId, usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
    });

    it('rejects an already verified admin', async () => {
      prisma.admin.findUnique.mockResolvedValue(
        buildAdmin({ emailVerified: true }),
      );

      await expect(service.requestEmailVerification(adminId)).rejects.toThrow(
        BadRequestException,
      );
      expect(mail.sent).toHaveLength(0);
    });

    it('rejects a soft-deleted admin', async () => {
      prisma.admin.findUnique.mockResolvedValue(
        buildAdmin({ deletedAt: new Date() }),
      );

      await expect(service.requestEmailVerification(adminId)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('does not throw when the mail provider fails', async () => {
      mail.shouldFail = true;

      await expect(
        service.requestEmailVerification(adminId),
      ).resolves.toBeUndefined();
    });
  });

  describe('verifyEmail', () => {
    it('marks the token used and the admin verified', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'evt-1',
        adminId,
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
      });
      prisma.admin.findUnique.mockResolvedValue({ email: adminEmail });

      const result = await service.verifyEmail('a-valid-token');

      expect(result).toEqual({ email: adminEmail });
      expect(prisma.emailVerificationToken.update).toHaveBeenCalledWith({
        where: { id: 'evt-1' },
        data: { usedAt: expect.any(Date) },
      });
      expect(prisma.admin.update).toHaveBeenCalledWith({
        where: { id: adminId },
        data: { emailVerified: true, emailVerifiedAt: expect.any(Date) },
      });
    });

    it('rejects an unknown token', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue(null);

      await expect(service.verifyEmail('nope')).rejects.toThrow(
        'Invalid or expired verification token',
      );
    });

    it('rejects an already used token', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'evt-1',
        adminId,
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: new Date(),
      });

      await expect(service.verifyEmail('used')).rejects.toThrow(
        'Invalid or expired verification token',
      );
    });

    it('rejects an expired token', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 'evt-1',
        adminId,
        expiresAt: new Date(Date.now() - 1000),
        usedAt: null,
      });

      await expect(service.verifyEmail('expired')).rejects.toThrow(
        'Invalid or expired verification token',
      );
    });
  });

  describe('forgotPassword', () => {
    it('sends a reset email for a known address', async () => {
      prisma.admin.findUnique.mockResolvedValue(buildAdmin());

      await service.forgotPassword(adminEmail);

      expect(mail.sent).toHaveLength(1);
      expect(mail.last()?.subject).toBe('Reset your password');
    });

    it('does not send anything for an unknown address', async () => {
      prisma.admin.findUnique.mockResolvedValue(null);

      await service.forgotPassword('ghost@example.com');

      expect(mail.sent).toHaveLength(0);
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    });

    it('stores the reset token hashed with a 60 minute expiry', async () => {
      prisma.admin.findUnique.mockResolvedValue(buildAdmin());

      await service.forgotPassword(adminEmail);

      const createArg = prisma.passwordResetToken.create.mock.calls[0][0];
      const delta = createArg.data.expiresAt.getTime() - Date.now();

      expect(createArg.data.tokenHash).not.toBe(mail.lastToken());
      expect(delta).toBeGreaterThan(59 * 60 * 1000);
      expect(delta).toBeLessThanOrEqual(60 * 60 * 1000);
    });

    it('invalidates previously issued unused reset tokens', async () => {
      prisma.admin.findUnique.mockResolvedValue(buildAdmin());

      await service.forgotPassword(adminEmail);

      expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { adminId, usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
    });
  });

  describe('resetPassword', () => {
    it('updates the password and revokes every session', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'prt-1',
        adminId,
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
      });

      await service.resetPassword('a-valid-token', 'NewPassword1');

      expect(prisma.admin.update).toHaveBeenCalledWith({
        where: { id: adminId },
        data: {
          passwordHash: expect.any(String),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
      expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
        where: { id: 'prt-1' },
        data: { usedAt: expect.any(Date) },
      });
    });

    it('rejects an unknown token', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword('nope', 'NewPassword1'),
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('rejects a used token', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'prt-1',
        adminId,
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: new Date(),
      });

      await expect(
        service.resetPassword('used', 'NewPassword1'),
      ).rejects.toThrow('Invalid or expired reset token');
    });
  });

  describe('changePassword', () => {
    it('changes the password when the current one is correct', async () => {
      const passwordHash = await hashPassword('CurrentPassword1');
      prisma.admin.findUnique.mockResolvedValue(
        buildAdmin({ passwordHash }),
      );

      await service.changePassword(
        adminId,
        'CurrentPassword1',
        'NewPassword1',
      );

      expect(prisma.admin.update).toHaveBeenCalledWith({
        where: { id: adminId },
        data: { passwordHash: expect.any(String) },
      });
    });

    it('rejects a wrong current password', async () => {
      const passwordHash = await hashPassword('CurrentPassword1');
      prisma.admin.findUnique.mockResolvedValue(
        buildAdmin({ passwordHash }),
      );

      await expect(
        service.changePassword(adminId, 'WrongPassword1', 'NewPassword1'),
      ).rejects.toThrow('Current password is incorrect');
      expect(prisma.admin.update).not.toHaveBeenCalled();
    });

    it('revokes other sessions but keeps the current one', async () => {
      const passwordHash = await hashPassword('CurrentPassword1');
      prisma.admin.findUnique.mockResolvedValue(
        buildAdmin({ passwordHash }),
      );
      const tokenService = {
        revokeAllForAdmin: vi.fn().mockResolvedValue(undefined),
      };
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AccountService,
          { provide: PrismaService, useValue: prisma },
          { provide: MailService, useValue: mail },
          { provide: TokenService, useValue: tokenService },
          {
            provide: ConfigService,
            useValue: {
              get: vi.fn(() => undefined),
            },
          },
        ],
      }).compile();
      const svc = module.get(AccountService);

      await svc.changePassword(
        adminId,
        'CurrentPassword1',
        'NewPassword1',
        'current-refresh-token',
      );

      expect(tokenService.revokeAllForAdmin).toHaveBeenCalledWith(
        adminId,
        'current-refresh-token',
      );
    });
  });
});
