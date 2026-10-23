import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { ConfigService } from '@nestjs/config';
import { ThrottlerStorage } from '@nestjs/throttler';
import { InquiryStatus } from '@prisma/client';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/database/prisma.service.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'e2e-admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'E2eAdminPass123!';

const validInquiry = {
  name: 'Ram Bahadur',
  email: 'ram@example.com',
  phone: '+977-9800000000',
  subject: 'Bulk order of plastic chairs',
  message: 'I would like to order 50 plastic chairs delivered to Pokhara.',
};

/** Payload the frontend contact form sends (no subject). */
const contactPayload = {
  name: 'Ram Bahadur',
  email: 'ram@example.com',
  phone: '+977-9800000000',
  message: 'I would like to order 50 plastic chairs delivered to Pokhara.',
};

describe('Inquiries (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let configService: ConfigService;
  let throttlerStorage: ThrottlerStorage;
  let adminCookies: string[];

  const loginAsAdmin = async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      .expect(200);

    return response.headers['set-cookie'] as unknown as string[];
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    configService = app.get(ConfigService);
    throttlerStorage = app.get(ThrottlerStorage);
    adminCookies = await loginAsAdmin();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.inquiry.deleteMany({});
  });

  /**
   * Removes the rate limit counters of the inquiry scope so a test can start
   * from a clean slate.
   */
  const clearInquiryThrottle = () => {
    const storage = throttlerStorage as unknown as {
      storage: Map<string, unknown>;
      hitExpirations: Map<string, unknown>;
    };

    for (const key of storage.storage.keys()) {
      if (key.startsWith('rate-limit:inquiry')) {
        storage.storage.delete(key);
        storage.hitExpirations.delete(key);
      }
    }
  };

  describe('POST /contacts (public, frontend contract)', () => {
    it('accepts the frontend payload and answers with { ok: true }', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/contacts')
        .send(contactPayload)
        .expect(201);

      expect(response.body).toEqual({ ok: true });

      const stored = await prisma.inquiry.findFirstOrThrow({
        where: { email: 'ram@example.com' },
      });

      expect(stored.name).toBe('Ram Bahadur');
      expect(stored.email).toBe('ram@example.com');
      expect(stored.status).toBe(InquiryStatus.NEW);
    });

    it('stores a default subject when none is given', async () => {
      await request(app.getHttpServer())
        .post('/api/contacts')
        .send(contactPayload)
        .expect(201);

      const stored = await prisma.inquiry.findFirstOrThrow({
        where: { email: 'ram@example.com' },
      });

      expect(stored.subject).toBe('Website enquiry');
    });

    it('stores an empty phone as null', async () => {
      await request(app.getHttpServer())
        .post('/api/contacts')
        .send({ ...contactPayload, phone: '' })
        .expect(201);

      const stored = await prisma.inquiry.findFirstOrThrow({
        where: { email: 'ram@example.com' },
      });

      expect(stored.phone).toBeNull();
    });

    it('never returns internal fields to the visitor', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/contacts')
        .send(contactPayload)
        .expect(201);

      expect(response.body.internalNote).toBeUndefined();
      expect(response.body.ipAddress).toBeUndefined();
      expect(response.body.email).toBeUndefined();
    });

    it('rejects an invalid email address', async () => {
      await request(app.getHttpServer())
        .post('/api/contacts')
        .send({ ...contactPayload, email: 'not-an-email' })
        .expect(400);
    });

    it('rejects a missing message', async () => {
      await request(app.getHttpServer())
        .post('/api/contacts')
        .send({ ...contactPayload, message: '' })
        .expect(400);
    });

    it('rejects unknown fields', async () => {
      await request(app.getHttpServer())
        .post('/api/contacts')
        .send({ ...contactPayload, status: 'REPLIED' })
        .expect(400);
    });

    it('drops honeypot submissions without storing them', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/contacts')
        .send({ ...contactPayload, website: 'http://spam.example' })
        .expect(201);

      expect(response.body).toEqual({ ok: true });
      expect(await prisma.inquiry.count()).toBe(0);
    });

    it('strips markup from the stored message', async () => {
      await request(app.getHttpServer())
        .post('/api/contacts')
        .send({ ...contactPayload, message: '<script>alert(1)</script>Hello' })
        .expect(201);

      const stored = await prisma.inquiry.findFirstOrThrow({
        where: { email: 'ram@example.com' },
      });

      expect(stored.message).toBe('alert(1)Hello');
    });
  });

  describe('GET /api/v1/admin/inquiries', () => {
    beforeEach(async () => {
      await prisma.inquiry.create({
        data: {
          name: 'Sita Kumari',
          email: 'sita@example.com',
          subject: 'Plastic pipes',
          message: 'Do you deliver plastic pipes to Butwal?',
          status: InquiryStatus.NEW,
        },
      });

      await prisma.inquiry.create({
        data: {
          name: 'Hari Ram',
          email: 'hari@example.com',
          subject: 'Water tank',
          message: 'What is the price of a 1000 litre tank?',
          status: InquiryStatus.REPLIED,
        },
      });
    });

    it('requires authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/inquiries')
        .expect(401);
    });

    it('lists the inquiries for admins', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/inquiries')
        .set('Cookie', adminCookies)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.total).toBe(2);
    });

    it('filters by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/inquiries')
        .query({ status: 'REPLIED' })
        .set('Cookie', adminCookies)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('REPLIED');
    });

    it('searches across the inquiry fields', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/inquiries')
        .query({ search: 'tank' })
        .set('Cookie', adminCookies)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Hari Ram');
    });

    it('returns a single inquiry', async () => {
      const inquiries = await prisma.inquiry.findMany();
      const id = inquiries[0].id;

      const response = await request(app.getHttpServer())
        .get(`/api/v1/admin/inquiries/${id}`)
        .set('Cookie', adminCookies)
        .expect(200);

      expect(response.body.id).toBe(id);
    });

    it('returns 404 for an unknown inquiry', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/inquiries/00000000-0000-0000-0000-000000000000')
        .set('Cookie', adminCookies)
        .expect(404);
    });
  });

  describe('PATCH /api/v1/admin/inquiries/:id/status', () => {
    it('updates the status', async () => {
      const inquiry = await prisma.inquiry.create({
        data: {
          name: 'Gita',
          email: 'gita@example.com',
          subject: 'Chairs',
          message: 'How much for 10 chairs?',
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/inquiries/${inquiry.id}/status`)
        .set('Cookie', adminCookies)
        .send({ status: 'REPLIED' })
        .expect(200);

      expect(response.body.status).toBe('REPLIED');
    });

    it('rejects an unknown status', async () => {
      const inquiry = await prisma.inquiry.create({
        data: {
          name: 'Gita',
          email: 'gita@example.com',
          subject: 'Chairs',
          message: 'How much for 10 chairs?',
        },
      });

      await request(app.getHttpServer())
        .patch(`/api/v1/admin/inquiries/${inquiry.id}/status`)
        .set('Cookie', adminCookies)
        .send({ status: 'SPAMMED' })
        .expect(400);
    });
  });

  describe('PATCH /api/v1/admin/inquiries/:id/note', () => {
    it('stores the internal note', async () => {
      const inquiry = await prisma.inquiry.create({
        data: {
          name: 'Gita',
          email: 'gita@example.com',
          subject: 'Chairs',
          message: 'How much for 10 chairs?',
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/inquiries/${inquiry.id}/note`)
        .set('Cookie', adminCookies)
        .send({ note: 'Called back on Monday' })
        .expect(200);

      expect(response.body.internalNote).toBe('Called back on Monday');
    });

    it('clears the note when an empty note is sent', async () => {
      const inquiry = await prisma.inquiry.create({
        data: {
          name: 'Gita',
          email: 'gita@example.com',
          subject: 'Chairs',
          message: 'How much for 10 chairs?',
          internalNote: 'Called back on Monday',
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/inquiries/${inquiry.id}/note`)
        .set('Cookie', adminCookies)
        .send({ note: '' })
        .expect(200);

      expect(response.body.internalNote).toBeNull();
    });
  });

  describe('DELETE /api/v1/admin/inquiries/:id', () => {
    it('deletes the inquiry', async () => {
      const inquiry = await prisma.inquiry.create({
        data: {
          name: 'Gita',
          email: 'gita@example.com',
          subject: 'Chairs',
          message: 'How much for 10 chairs?',
        },
      });

      await request(app.getHttpServer())
        .delete(`/api/v1/admin/inquiries/${inquiry.id}`)
        .set('Cookie', adminCookies)
        .expect(204);

      expect(await prisma.inquiry.count()).toBe(0);
    });
  });

  describe('rate limiting', () => {
    it('blocks submissions over the configured limit', async () => {
      const originalLimit = configService.get<number>(
        'security.inquiryRateLimitLimit',
      );

      clearInquiryThrottle();

      configService.set('security.inquiryRateLimitLimit', 1);

      try {
        await request(app.getHttpServer())
          .post('/api/contacts')
          .send(validInquiry)
          .expect(201);

        await request(app.getHttpServer())
          .post('/api/contacts')
          .send(validInquiry)
          .expect(429);
      } finally {
        configService.set('security.inquiryRateLimitLimit', originalLimit ?? 5);

        clearInquiryThrottle();
      }
    });
  });
});
