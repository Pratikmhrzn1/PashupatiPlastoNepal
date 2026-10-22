import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { TokenService } from './token.service.js';
import { PrismaService } from '../../database/prisma.service.js';
import { hashPassword } from '../../common/utils/crypto.utils.js';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { admin: { findUnique: any; update: any } };

  const validAdmin = {
    id: 'admin-1',
    email: 'admin@example.com',
    passwordHash: '',
    role: 'ADMIN',
    deletedAt: null as Date | null,
    failedLoginAttempts: 0,
    lockedUntil: null as Date | null,
  };

  beforeEach(async () => {
    prisma = {
      admin: {
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue(validAdmin),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: TokenService,
          useValue: {
            issue: vi.fn().mockResolvedValue({
              accessToken: 'access.jwt',
              refreshToken: 'refresh-token',
            }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => {
              const values: Record<string, unknown> = {
                'security.maxLoginAttempts': 5,
                'security.lockoutDurationMs': 900_000,
              };
              return values[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('login', () => {
    beforeEach(async () => {
      validAdmin.passwordHash = await hashPassword('CorrectHorse1!');
      validAdmin.failedLoginAttempts = 0;
      validAdmin.lockedUntil = null;
    });

    it('returns the admin profile and tokens on valid credentials', async () => {
      prisma.admin.findUnique.mockResolvedValue(validAdmin);

      const result = await service.login(
        { email: 'admin@example.com', password: 'CorrectHorse1!' },
        { userAgent: 'vitest', ipAddress: '127.0.0.1' },
      );

      expect(result.admin).toEqual({
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'ADMIN',
      });
      expect(result.accessToken).toBe('access.jwt');
      expect(result.refreshToken).toBe('refresh-token');
    });

    it('looks the admin up by lowercased email', async () => {
      prisma.admin.findUnique.mockResolvedValue(validAdmin);

      await service.login(
        { email: 'Admin@Example.com', password: 'CorrectHorse1!' },
        {},
      );

      expect(prisma.admin.findUnique).toHaveBeenCalledWith({
        where: { email: 'admin@example.com' },
      });
    });

    it('rejects an unknown email with a generic message', async () => {
      prisma.admin.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nope@example.com', password: 'whatever1!' }, {}),
      ).rejects.toThrow('Invalid email or password');
    });

    it('rejects a wrong password with the same generic message', async () => {
      prisma.admin.findUnique.mockResolvedValue(validAdmin);

      await expect(
        service.login({ email: 'admin@example.com', password: 'WrongPassword1!' }, {}),
      ).rejects.toThrow('Invalid email or password');
    });

    it('does not reveal whether the email exists', async () => {
      prisma.admin.findUnique.mockResolvedValue(null);
      const unknownError = await service
        .login({ email: 'nope@example.com', password: 'whatever1!' }, {})
        .catch((e: Error) => e.message);

      prisma.admin.findUnique.mockResolvedValue(validAdmin);
      const wrongPasswordError = await service
        .login({ email: 'admin@example.com', password: 'WrongPassword1!' }, {})
        .catch((e: Error) => e.message);

      expect(unknownError).toBe(wrongPasswordError);
    });

    it('records a failed attempt without locking below the threshold', async () => {
      prisma.admin.findUnique.mockResolvedValue({ ...validAdmin, failedLoginAttempts: 2 });

      await expect(
        service.login({ email: 'admin@example.com', password: 'WrongPassword1!' }, {}),
      ).rejects.toThrow(UnauthorizedException);

      expect(prisma.admin.update).toHaveBeenCalledWith({
        where: { id: 'admin-1' },
        data: {
          failedLoginAttempts: 3,
          lockedUntil: null,
        },
      });
    });

    it('locks the account once the failure threshold is reached', async () => {
      prisma.admin.findUnique.mockResolvedValue({ ...validAdmin, failedLoginAttempts: 4 });

      await expect(
        service.login({ email: 'admin@example.com', password: 'WrongPassword1!' }, {}),
      ).rejects.toThrow(UnauthorizedException);

      const updateArg = prisma.admin.update.mock.calls[0][0];
      expect(updateArg.data.failedLoginAttempts).toBe(5);
      expect(updateArg.data.lockedUntil).toBeInstanceOf(Date);
    });

    it('refuses to authenticate a locked account even with correct credentials', async () => {
      prisma.admin.findUnique.mockResolvedValue({
        ...validAdmin,
        lockedUntil: new Date(Date.now() + 60_000),
      });

      await expect(
        service.login({ email: 'admin@example.com', password: 'CorrectHorse1!' }, {}),
      ).rejects.toThrow('Account locked');
    });

    it('resets the lock counters and stamps lastLoginAt on success', async () => {
      prisma.admin.findUnique.mockResolvedValue({
        ...validAdmin,
        failedLoginAttempts: 3,
      });

      await service.login(
        { email: 'admin@example.com', password: 'CorrectHorse1!' },
        {},
      );

      expect(prisma.admin.update).toHaveBeenCalledWith({
        where: { id: 'admin-1' },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: expect.any(Date),
        },
      });
    });

    it('rejects a soft-deleted admin', async () => {
      prisma.admin.findUnique.mockResolvedValue({
        ...validAdmin,
        deletedAt: new Date(),
      });

      await expect(
        service.login({ email: 'admin@example.com', password: 'CorrectHorse1!' }, {}),
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('me', () => {
    it('returns the admin profile', async () => {
      prisma.admin.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'ADMIN',
        emailVerified: true,
        createdAt: new Date(),
      });

      const result = await service.me('admin-1');

      expect(result.email).toBe('admin@example.com');
      expect(result.role).toBe('ADMIN');
    });

    it('throws when the admin no longer exists', async () => {
      prisma.admin.findUnique.mockResolvedValue(null);

      await expect(service.me('missing')).rejects.toThrow(UnauthorizedException);
    });
  });
});
