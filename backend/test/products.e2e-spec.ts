import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import { ProductStatus } from '@prisma/client';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/database/prisma.service.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'e2e-admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'E2eAdminPass123!';

describe('Products (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let cache: Cache;
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
    cache = app.get<Cache>(CACHE_MANAGER);
    adminCookies = await loginAsAdmin();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cache.clear();
    await prisma.inquiry.deleteMany({});
    await prisma.product.deleteMany({});

    const admin = await prisma.admin.findUniqueOrThrow({
      where: { email: ADMIN_EMAIL },
    });

    await prisma.product.create({
      data: {
        name: 'Public Chair',
        slug: 'public-chair',
        description: 'For everyone to see',
        price: 1500,
        currency: 'NPR',
        unit: 'piece',
        images: ['https://example.com/chair.jpg'],
        category: 'Furniture',
        status: ProductStatus.ACTIVE,
        featured: true,
        createdById: admin.id,
      },
    });

    await prisma.product.create({
      data: {
        name: 'Draft Table',
        slug: 'draft-table',
        description: 'Not published yet',
        price: 2500,
        currency: 'NPR',
        images: [],
        category: 'Furniture',
        status: ProductStatus.DRAFT,
        featured: false,
        createdById: admin.id,
      },
    });
  });

  describe('GET /products (public, frontend contract)', () => {
    it('returns a plain array of active products', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body.data).toBeUndefined();
      expect(response.body.meta).toBeUndefined();
      expect(response.headers['cache-control']).toBeDefined();
      expect(response.headers.etag).toBeDefined();
    });

    it('maps a product to the frontend product shape', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products')
        .expect(200);

      expect(response.body[0]).toMatchObject({
        id: expect.any(String),
        name: 'Public Chair',
        price: 'NPR 1500 / piece',
        description: 'For everyone to see',
        image: 'https://example.com/chair.jpg',
      });
    });

    it('does not expose draft products', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products')
        .expect(200);

      const names = response.body.map((p: { name: string }) => p.name);
      expect(names).not.toContain('Draft Table');
    });

    it('returns 304 when ETag matches', async () => {
      const first = await request(app.getHttpServer())
        .get('/api/products')
        .expect(200);

      const etag = first.headers.etag;

      await request(app.getHttpServer())
        .get('/api/products')
        .set('If-None-Match', etag)
        .expect(304);
    });

    it('invalidates the list cache after an admin creates an active product', async () => {
      const before = await request(app.getHttpServer())
        .get('/api/products')
        .expect(200);

      expect(before.body).toHaveLength(1);

      await request(app.getHttpServer())
        .post('/api/v1/admin/products')
        .set('Cookie', adminCookies)
        .send({ name: 'New Bench', status: 'ACTIVE' })
        .expect(201);

      const after = await request(app.getHttpServer())
        .get('/api/products')
        .expect(200);

      expect(after.body).toHaveLength(2);
    });
  });

  describe('GET /products/featured (public)', () => {
    it('returns the best selling products, capped at the limit', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products/featured')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(4);
      expect(response.body[0].name).toBe('Public Chair');
    });

    it('ranks the featured products by the static catalog figures', async () => {
      await prisma.product.create({
        data: {
          name: 'Safety Helmets',
          slug: 'safety-helmets',
          description: 'Helmets',
          price: 450,
          currency: 'NPR',
          unit: 'piece',
          images: ['/products/helmet.webp'],
          category: 'Safety',
          status: ProductStatus.ACTIVE,
          featured: true,
          createdById: (
            await prisma.admin.findUniqueOrThrow({
              where: { email: ADMIN_EMAIL },
            })
          ).id,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/products/featured')
        .expect(200);

      expect(response.body[0].name).toBe('Safety Helmets');
      expect(response.body[0].soldCount).toBe(3200);
      expect(response.body[0].price).toBe('NPR 450 / piece');
      expect(response.body[0].image).toContain('/products/helmet.webp');
    });

    it('does not treat "featured" as a product identifier', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products/featured')
        .expect(200);

      expect(
        response.body.every((p: { name: string }) => p.name !== 'featured'),
      ).toBe(true);
    });
  });

  describe('GET /products/:idOrSlug (public)', () => {
    it('fetches an active product by slug', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products/public-chair')
        .expect(200);

      expect(response.body.name).toBe('Public Chair');
      expect(response.body.price).toBe('NPR 1500 / piece');
      expect(response.headers.etag).toBeDefined();
    });

    it('fetches an active product by id', async () => {
      const product = await prisma.product.findUniqueOrThrow({
        where: { slug: 'public-chair' },
      });

      const response = await request(app.getHttpServer())
        .get(`/products/${product.id}`)
        .expect(200);

      expect(response.body.id).toBe(product.id);
    });

    it('returns 404 for a draft product', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products/draft-table')
        .expect(404);

      expect(response.body.message).toBe('Product not found');
    });

    it('returns 404 for an unknown product', async () => {
      await request(app.getHttpServer()).get('/api/products/nope').expect(404);
    });

    it('invalidates the detail cache after an admin update', async () => {
      const before = await request(app.getHttpServer())
        .get('/api/products/public-chair')
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/api/v1/admin/products/${before.body.id}`)
        .set('Cookie', adminCookies)
        .send({ name: 'Renamed Chair' })
        .expect(200);

      const after = await request(app.getHttpServer())
        .get('/api/products/public-chair')
        .expect(200);

      expect(after.body.name).toBe('Renamed Chair');
    });
  });

  describe('GET /api/v1/admin/products', () => {
    it('requires authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/products')
        .expect(401);
    });

    it('lists all products including drafts for admins', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/products')
        .set('Cookie', adminCookies)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('can filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/products')
        .query({ status: 'DRAFT' })
        .set('Cookie', adminCookies)
        .expect(200);

      expect(
        response.body.data.every(
          (p: { status: string }) => p.status === 'DRAFT',
        ),
      ).toBe(true);
    });
  });

  describe('POST /api/v1/admin/products', () => {
    it('creates a product with a generated slug', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/products')
        .set('Cookie', adminCookies)
        .send({ name: 'Stainless Pipe', price: 500 })
        .expect(201);

      expect(response.body.slug).toBe('stainless-pipe');
      expect(response.body.status).toBe('DRAFT');
    });

    it('rejects a duplicate slug', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/products')
        .set('Cookie', adminCookies)
        .send({ name: 'Copy', slug: 'public-chair' })
        .expect(409);
    });
  });

  describe('PATCH /api/v1/admin/products/:id/publish', () => {
    it('publishes a draft product', async () => {
      const products = await prisma.product.findMany();
      const draft = products.find((p) => p.slug === 'draft-table')!;

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/products/${draft.id}/publish`)
        .set('Cookie', adminCookies)
        .expect(200);

      expect(response.body.status).toBe('ACTIVE');

      await request(app.getHttpServer())
        .get('/api/products/draft-table')
        .expect(200);
    });
  });

  describe('DELETE /api/v1/admin/products/:id', () => {
    it('soft deletes a product and hides it from public list', async () => {
      const products = await prisma.product.findMany();
      const active = products.find((p) => p.slug === 'public-chair')!;

      await request(app.getHttpServer())
        .delete(`/api/v1/admin/products/${active.id}`)
        .set('Cookie', adminCookies)
        .expect(204);

      await request(app.getHttpServer())
        .get('/api/products/public-chair')
        .expect(404);

      const adminList = await request(app.getHttpServer())
        .get('/api/v1/admin/products')
        .query({ includeDeleted: true })
        .set('Cookie', adminCookies)
        .expect(200);

      const deleted = adminList.body.data.find(
        (p: { slug: string }) => p.slug === 'public-chair',
      );
      expect(deleted.deletedAt).not.toBeNull();
    });
  });
});
