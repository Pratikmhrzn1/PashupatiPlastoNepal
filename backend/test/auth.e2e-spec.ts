import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/database/prisma.service.js';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '../src/modules/auth/auth.controller.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'e2e-admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'E2eAdminPass123!';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.admin.updateMany({
      where: { email: ADMIN_EMAIL },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
    await prisma.refreshToken.deleteMany({});
  });

  describe('POST /api/v1/auth/login', () => {
    it('authenticates with valid credentials and sets httpOnly cookies', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        .expect(200);

      expect(response.body.admin).toMatchObject({
        email: ADMIN_EMAIL,
        role: 'ADMIN',
      });
      expect(response.body.admin.passwordHash).toBeUndefined();

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();

      const accessCookie = cookies.find((c) => c.startsWith(ACCESS_TOKEN_COOKIE));
      const refreshCookie = cookies.find((c) => c.startsWith(REFRESH_TOKEN_COOKIE));

      expect(accessCookie).toContain('HttpOnly');
      expect(refreshCookie).toContain('HttpOnly');
      expect(refreshCookie).toContain('SameSite=Strict');
    });

    it('rejects a wrong password with 401 and no cookies', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: ADMIN_EMAIL, password: 'DefinitelyWrong1!' })
        .expect(401);

      expect(response.body.message).toBe('Invalid email or password');
      expect(response.headers['set-cookie']).toBeUndefined();
    });

    it('does not reveal whether an email exists', async () => {
      const unknown = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'ghost@example.com', password: 'SomePassword1!' })
        .expect(401);

      const wrongPassword = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: ADMIN_EMAIL, password: 'SomePassword1!' })
        .expect(401);

      expect(unknown.body.message).toBe(wrongPassword.body.message);
    });

    it('rejects a malformed body with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'not-an-email', password: 'short' })
        .expect(400);
    });

    it('locks the account after repeated failed attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email: ADMIN_EMAIL, password: 'DefinitelyWrong1!' })
          .expect(401);
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        .expect(401);

      expect(response.body.message).toContain('locked');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns the admin profile when the access token cookie is present', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        .expect(200);

      const cookies = login.headers['set-cookie'] as unknown as string[];

      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.email).toBe(ADMIN_EMAIL);
      expect(response.body.role).toBe('ADMIN');
    });

    it('returns 401 without a token', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    });

    it('returns 401 with a tampered token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', `${ACCESS_TOKEN_COOKIE}=not.a.valid.token`)
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('rotates the refresh token and issues new cookies', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        .expect(200);

      const cookies = login.headers['set-cookie'] as unknown as string[];
      const oldRefresh = cookies
        .find((c) => c.startsWith(REFRESH_TOKEN_COOKIE))!
        .split(';')[0];

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', oldRefresh)
        .expect(200);

      expect(response.body.message).toBe('Tokens refreshed');

      const newCookies = response.headers['set-cookie'] as unknown as string[];
      const newRefresh = newCookies
        .find((c) => c.startsWith(REFRESH_TOKEN_COOKIE))!
        .split(';')[0];

      expect(newRefresh).not.toBe(oldRefresh);
    });

    it('rejects reuse of an already rotated refresh token', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        .expect(200);

      const cookies = login.headers['set-cookie'] as unknown as string[];
      const refresh = cookies
        .find((c) => c.startsWith(REFRESH_TOKEN_COOKIE))!
        .split(';')[0];

      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', refresh)
        .expect(200);

      const reuse = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', refresh)
        .expect(401);

      expect(reuse.body.message).toBe('Token reuse detected');
    });

    it('returns 401 without a refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('revokes the refresh token and clears the cookies', async () => {
      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        .expect(200);

      const cookies = login.headers['set-cookie'] as unknown as string[];
      const refresh = cookies
        .find((c) => c.startsWith(REFRESH_TOKEN_COOKIE))!
        .split(';')[0];

      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Cookie', refresh)
        .expect(200);

      const stored = await prisma.refreshToken.findMany({
        where: { admin: { email: ADMIN_EMAIL } },
      });
      expect(stored.every((t) => t.revokedAt !== null)).toBe(true);
    });
  });
});
