import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { MailService } from '../src/modules/mail/mail.service.js';
import { MockMailService } from './mocks/mock-mail.service.js';
import { REFRESH_TOKEN_COOKIE } from '../src/common/constants/auth.constants.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'e2e-admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'E2eAdminPass123!';
const NEW_PASSWORD = 'ResetPassword123!';

describe('Account flows (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let mail: MockMailService;
  let originalPasswordHash: string;
  let originalEmailVerified: boolean;

  const login = async (email = ADMIN_EMAIL, password = ADMIN_PASSWORD) => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);

    return response.headers['set-cookie'] as unknown as string[];
  };

  beforeAll(async () => {
    mail = new MockMailService();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue(mail)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);

    const admin = await prisma.admin.findUniqueOrThrow({
      where: { email: ADMIN_EMAIL },
    });
    originalPasswordHash = admin.passwordHash;
    originalEmailVerified = admin.emailVerified;
  });

  afterAll(async () => {
    await prisma.admin.update({
      where: { email: ADMIN_EMAIL },
      data: { passwordHash: originalPasswordHash },
    });

    await app.close();
  });

  beforeEach(async () => {
    mail.reset();

    await prisma.admin.update({
      where: { email: ADMIN_EMAIL },
      data: {
        passwordHash: originalPasswordHash,
        emailVerified: originalEmailVerified,
        emailVerifiedAt: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await prisma.refreshToken.deleteMany({});
    await prisma.emailVerificationToken.deleteMany({});
    await prisma.passwordResetToken.deleteMany({});
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('returns the same generic message for a known address', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: ADMIN_EMAIL })
        .expect(200);

      expect(response.body.message).toBe(
        'If an account exists for that email address, a password reset link has been sent.',
      );
      expect(mail.sent).toHaveLength(1);
      expect(mail.last()?.to).toBe(ADMIN_EMAIL);
    });

    it('returns the same generic message for an unknown address', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'ghost@example.com' })
        .expect(200);

      expect(response.body.message).toBe(
        'If an account exists for that email address, a password reset link has been sent.',
      );
      expect(mail.sent).toHaveLength(0);
    });

    it('rejects a malformed email with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'not-an-email' })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('sets the new password so it can be used to log in', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: ADMIN_EMAIL })
        .expect(200);

      const token = mail.lastToken();
      expect(token).toBeTruthy();

      await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ token, password: NEW_PASSWORD })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: ADMIN_EMAIL, password: NEW_PASSWORD })
        .expect(200);
    });

    it('rejects an unknown token with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ token: 'a-token-that-does-not-exist', password: NEW_PASSWORD })
        .expect(400);
    });

    it('rejects a weak password with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: ADMIN_EMAIL })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ token: mail.lastToken(), password: 'short' })
        .expect(400);
    });

    it('revokes every refresh token issued before the reset', async () => {
      const cookies = await login();
      const refresh = cookies
        .find((c) => c.startsWith(REFRESH_TOKEN_COOKIE))!
        .split(';')[0];

      await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: ADMIN_EMAIL })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ token: mail.lastToken(), password: NEW_PASSWORD })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', refresh)
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/verify-email', () => {
    beforeEach(async () => {
      await prisma.admin.update({
        where: { email: ADMIN_EMAIL },
        data: { emailVerified: false },
      });
    });

    it('verifies the address with the emailed token', async () => {
      const cookies = await login();

      await request(app.getHttpServer())
        .post('/api/v1/auth/resend-verification')
        .set('Cookie', cookies)
        .expect(200);

      const token = mail.lastToken();
      expect(token).toBeTruthy();

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token })
        .expect(200);

      expect(response.body.email).toBe(ADMIN_EMAIL);

      const admin = await prisma.admin.findUniqueOrThrow({
        where: { email: ADMIN_EMAIL },
      });
      expect(admin.emailVerified).toBe(true);
    });

    it('rejects a token that was already used', async () => {
      const cookies = await login();

      await request(app.getHttpServer())
        .post('/api/v1/auth/resend-verification')
        .set('Cookie', cookies)
        .expect(200);

      const token = mail.lastToken();

      await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token })
        .expect(400);
    });

    it('rejects an unknown token with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token: 'a-token-that-does-not-exist' })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/resend-verification', () => {
    beforeEach(async () => {
      await prisma.admin.update({
        where: { email: ADMIN_EMAIL },
        data: { emailVerified: false },
      });
    });

    it('requires authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/resend-verification')
        .expect(401);
    });

    it('sends a new verification email', async () => {
      const cookies = await login();

      await request(app.getHttpServer())
        .post('/api/v1/auth/resend-verification')
        .set('Cookie', cookies)
        .expect(200);

      expect(mail.sent).toHaveLength(1);
      expect(mail.last()?.subject).toBe('Verify your email address');
    });

    it('refuses to send when the address is already verified', async () => {
      await prisma.admin.update({
        where: { email: ADMIN_EMAIL },
        data: { emailVerified: true },
      });

      const cookies = await login();

      await request(app.getHttpServer())
        .post('/api/v1/auth/resend-verification')
        .set('Cookie', cookies)
        .expect(400);

      expect(mail.sent).toHaveLength(0);
    });
  });

  describe('POST /api/v1/auth/change-password', () => {
    it('requires authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .send({ currentPassword: ADMIN_PASSWORD, newPassword: NEW_PASSWORD })
        .expect(401);
    });

    it('rejects a wrong current password with 401', async () => {
      const cookies = await login();

      await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Cookie', cookies)
        .send({
          currentPassword: 'DefinitelyWrong1!',
          newPassword: NEW_PASSWORD,
        })
        .expect(401);
    });

    it('changes the password so the new one can be used to log in', async () => {
      const cookies = await login();

      await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Cookie', cookies)
        .send({
          currentPassword: ADMIN_PASSWORD,
          newPassword: NEW_PASSWORD,
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: ADMIN_EMAIL, password: NEW_PASSWORD })
        .expect(200);
    });

    it('keeps the current session alive and revokes the others', async () => {
      const first = await login();
      const second = await login();

      const firstRefresh = first
        .find((c) => c.startsWith(REFRESH_TOKEN_COOKIE))!
        .split(';')[0];
      const secondRefresh = second
        .find((c) => c.startsWith(REFRESH_TOKEN_COOKIE))!
        .split(';')[0];

      await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Cookie', first)
        .send({
          currentPassword: ADMIN_PASSWORD,
          newPassword: NEW_PASSWORD,
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', firstRefresh)
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', secondRefresh)
        .expect(401);
    });
  });

  describe('rate limiting', () => {
    it('returns 429 once the scope limit is exhausted', async () => {
      const configService = app.get(ConfigService);
      const originalGet = configService.get.bind(configService);

      // A limit of zero blocks every request, which keeps the assertion
      // independent of the requests earlier tests made against the same scope.
      const spy = vi
        .spyOn(configService, 'get')
        .mockImplementation((key: string) =>
          key === 'security.passwordRateLimitLimit'
            ? 0
            : originalGet(key),
        );

      try {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/forgot-password')
          .send({ email: ADMIN_EMAIL })
          .expect(429);

        expect(response.body.message).toBe(
          'Too many requests, please try again later.',
        );
      } finally {
        spy.mockRestore();
      }
    });
  });
});
