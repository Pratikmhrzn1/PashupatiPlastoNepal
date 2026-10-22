import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { TokenService } from './token.service.js';
import { PrismaService } from '../../database/prisma.service.js';

describe('TokenService', () => {
  let service: TokenService;
  let prisma: { refreshToken: { create: any; findUnique: any; update: any; updateMany: any } };

  const adminId = 'admin-1';
  const refreshTokenRow = {
    id: 'rt-1',
    adminId,
    tokenHash: 'hash',
    revokedAt: null as Date | null,
    expiresAt: new Date(Date.now() + 60_000),
  };

  beforeEach(async () => {
    prisma = {
      refreshToken: {
        create: vi.fn().mockResolvedValue(refreshTokenRow),
        findUnique: vi.fn().mockResolvedValue(refreshTokenRow),
        update: vi.fn().mockResolvedValue(refreshTokenRow),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => {
              const values: Record<string, unknown> = {
                'jwt.accessSecret': 'access-secret-value-that-is-long-enough',
                'jwt.accessExpiresIn': '15m',
                'jwt.refreshExpiresIn': '7d',
              };
              return values[key];
            }),
          },
        },
        {
          provide: (await import('@nestjs/jwt')).JwtService,
          useValue: {
            sign: vi.fn(() => 'signed.access.token'),
          },
        },
      ],
    }).compile();

    service = module.get(TokenService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  describe('issue', () => {
    it('returns an access token and a refresh token', async () => {
      const tokens = await service.issue(adminId);

      expect(tokens.accessToken).toBe('signed.access.token');
      expect(tokens.refreshToken).toMatch(/^[0-9a-f]{64}$/);
    });

    it('persists the hashed refresh token, never the raw one', async () => {
      const tokens = await service.issue(adminId, {
        userAgent: 'vitest',
        ipAddress: '127.0.0.1',
      });

      const createArg = prisma.refreshToken.create.mock.calls[0][0];
      expect(createArg.data.tokenHash).not.toBe(tokens.refreshToken);
      expect(createArg.data.adminId).toBe(adminId);
      expect(createArg.data.userAgent).toBe('vitest');
      expect(createArg.data.ipAddress).toBe('127.0.0.1');
    });

    it('stores an expiry 7 days out', async () => {
      await service.issue(adminId);

      const createArg = prisma.refreshToken.create.mock.calls[0][0];
      const delta = createArg.data.expiresAt.getTime() - Date.now();
      expect(delta).toBeGreaterThan(6.9 * 24 * 60 * 60 * 1000);
      expect(delta).toBeLessThanOrEqual(7 * 24 * 60 * 60 * 1000);
    });
  });

  describe('rotate', () => {
    it('rejects a missing token', async () => {
      await expect(service.rotate('')).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an unknown token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.rotate('unknown')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('revokes the presented token and issues a new pair', async () => {
      const tokens = await service.rotate('presented-token');

      expect(prisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: refreshTokenRow.id },
          data: { revokedAt: expect.any(Date) },
        }),
      );
      expect(tokens.refreshToken).toMatch(/^[0-9a-f]{64}$/);
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });

    it('detects reuse of an already revoked token and revokes every token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        ...refreshTokenRow,
        revokedAt: new Date(),
      });

      await expect(service.rotate('reused-token')).rejects.toThrow(
        'Token reuse detected',
      );
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ adminId }),
          data: { revokedAt: expect.any(Date) },
        }),
      );
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it('rejects an expired token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        ...refreshTokenRow,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.rotate('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('revoke', () => {
    it('does nothing without a token', async () => {
      await service.revoke(undefined);

      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    });

    it('revokes the matching token', async () => {
      await service.revoke('some-token');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ revokedAt: null }),
        }),
      );
    });
  });
});
