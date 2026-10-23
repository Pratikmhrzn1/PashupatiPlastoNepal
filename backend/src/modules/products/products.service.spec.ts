import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { ProductsService } from './products.service.js';
import { PrismaService } from '../../database/prisma.service.js';
import { AdminQueryProductsDto } from './dto/query-products.dto.js';

class MemoryCache {
  private readonly store = new Map<
    string,
    { value: unknown; expiresAt: number }
  >();

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);
    if (!entry || entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<T> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttl ?? 60_000),
    });
    return value;
  }

  async del(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async clear(): Promise<boolean> {
    this.store.clear();
    return true;
  }
}

const buildProduct = (overrides: Record<string, unknown> = {}) => ({
  id: 'product-1',
  name: 'Plastic Chair',
  slug: 'plastic-chair',
  description: 'A sturdy chair',
  price: 1999.5,
  currency: 'NPR',
  unit: 'piece',
  images: ['https://example.com/chair.jpg'],
  category: 'Furniture',
  status: ProductStatus.ACTIVE,
  featured: false,
  createdById: 'admin-1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  deletedAt: null,
  ...overrides,
});

describe('ProductsService', () => {
  let service: ProductsService;
  let cache: MemoryCache;
  let prisma: {
    product: {
      count: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    cache = new MemoryCache();

    prisma = {
      product: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      $transaction: vi.fn(async (operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => {
              const values: Record<string, unknown> = {
                'cache.productListTtlSeconds': 60,
                'cache.productDetailTtlSeconds': 300,
                frontendUrl: 'https://pashupati.com.np',
                'site.featuredProductLimit': 4,
                'site.publicProductLimit': 200,
              };
              return values[key];
            }),
          },
        },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  describe('findAllPublic', () => {
    it('only queries active, non-deleted products', async () => {
      prisma.product.findMany.mockResolvedValue([buildProduct()]);

      const result = await service.findAllPublic();

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { status: ProductStatus.ACTIVE, deletedAt: null },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: 200,
      });
      expect(result[0]).toMatchObject({
        id: 'product-1',
        name: 'Plastic Chair',
        price: 'NPR 1999.50 / piece',
        description: 'A sturdy chair',
        image: 'https://example.com/chair.jpg',
      });
    });

    it('returns a plain array without pagination metadata', async () => {
      prisma.product.findMany.mockResolvedValue([buildProduct()]);

      const result = await service.findAllPublic();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });

    it('resolves relative images against the frontend origin', async () => {
      prisma.product.findMany.mockResolvedValue([
        buildProduct({ images: ['/products/helmet.webp'] }),
      ]);

      const result = await service.findAllPublic();

      expect(result[0].image).toBe(
        'https://pashupati.com.np/products/helmet.webp',
      );
    });

    it('adds the static catalog sold count when the product is part of it', async () => {
      prisma.product.findMany.mockResolvedValue([
        buildProduct({ slug: 'safety-helmets' }),
      ]);

      const result = await service.findAllPublic();

      expect(result[0].soldCount).toBe(3200);
    });

    it('omits the sold count for products outside the static catalog', async () => {
      prisma.product.findMany.mockResolvedValue([buildProduct()]);

      const result = await service.findAllPublic();

      expect(result[0].soldCount).toBeUndefined();
    });

    it('caches the list until it is invalidated', async () => {
      prisma.product.findMany.mockResolvedValue([buildProduct()]);

      await service.findAllPublic();
      await service.findAllPublic();

      expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('findFeaturedPublic', () => {
    it('ranks products by the static catalog figures', async () => {
      prisma.product.findMany.mockResolvedValue([
        buildProduct({ id: 'p1', slug: 'pet-bottles' }),
        buildProduct({ id: 'p2', slug: 'safety-helmets' }),
      ]);

      const result = await service.findFeaturedPublic();

      expect(result.map((product) => product.id)).toEqual(['p2', 'p1']);
      expect(result[0].soldCount).toBe(3200);
    });

    it('caps the featured list at the configured limit', async () => {
      prisma.product.findMany.mockResolvedValue([
        buildProduct({ id: 'p1', slug: 'safety-helmets' }),
        buildProduct({ id: 'p2', slug: 'oem-pipe-fittings' }),
        buildProduct({ id: 'p3', slug: 'pipe-clamps' }),
        buildProduct({ id: 'p4', slug: 'plastic-brick-moulds' }),
        buildProduct({ id: 'p5', slug: 'pp-woven-sacks' }),
      ]);

      const result = await service.findFeaturedPublic();

      expect(result).toHaveLength(4);
      expect(result.map((product) => product.id)).toEqual([
        'p1',
        'p2',
        'p3',
        'p4',
      ]);
    });
  });

  describe('findOnePublic', () => {
    it('finds a product by slug when the identifier is not a UUID', async () => {
      prisma.product.findFirst.mockResolvedValue(buildProduct());

      const result = await service.findOnePublic('plastic-chair');

      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: {
          status: ProductStatus.ACTIVE,
          deletedAt: null,
          slug: 'plastic-chair',
        },
      });
      expect(result).toMatchObject({
        id: 'product-1',
        name: 'Plastic Chair',
        price: 'NPR 1999.50 / piece',
        description: 'A sturdy chair',
        image: 'https://example.com/chair.jpg',
      });
    });

    it('finds a product by id when the identifier is a UUID', async () => {
      const id = '11111111-1111-4111-8111-111111111111';
      prisma.product.findFirst.mockResolvedValue(buildProduct({ id }));

      await service.findOnePublic(id);

      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: {
          status: ProductStatus.ACTIVE,
          deletedAt: null,
          id,
        },
      });
    });

    it('throws NotFound for a missing product', async () => {
      await expect(service.findOnePublic('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('serves a cached detail until invalidated', async () => {
      prisma.product.findFirst.mockResolvedValue(buildProduct());

      await service.findOnePublic('plastic-chair');
      await service.findOnePublic('plastic-chair');

      expect(prisma.product.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAllAdmin', () => {
    it('includes soft-deleted products only when requested', async () => {
      await service.findAllAdmin(
        Object.assign(new AdminQueryProductsDto(), {
          page: 1,
          limit: 20,
          sort: 'createdAt',
          order: 'desc',
          includeDeleted: true,
        }),
      );

      expect(prisma.product.count).toHaveBeenCalledWith({ where: {} });
    });

    it('defaults to hiding soft-deleted products', async () => {
      await service.findAllAdmin(
        Object.assign(new AdminQueryProductsDto(), {
          page: 1,
          limit: 20,
          sort: 'createdAt',
          order: 'desc',
          includeDeleted: false,
        }),
      );

      expect(prisma.product.count).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
    });
  });

  describe('create', () => {
    it('generates a slug from the name and defaults', async () => {
      prisma.product.create.mockResolvedValue(buildProduct());

      await service.create({ name: '  Brown Plastic Chair  ' }, 'admin-1');

      expect(prisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: '  Brown Plastic Chair  ',
          slug: 'brown-plastic-chair',
          currency: 'NPR',
          status: ProductStatus.DRAFT,
          featured: false,
          createdById: 'admin-1',
        }),
      });
    });

    it('appends a suffix when a generated slug is already taken', async () => {
      prisma.product.findUnique
        .mockResolvedValueOnce({ id: 'other' })
        .mockResolvedValueOnce(null);
      prisma.product.create.mockResolvedValue(
        buildProduct({ slug: 'brown-chair-2' }),
      );

      await service.create({ name: 'Brown Chair' }, 'admin-1');

      expect(prisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ slug: 'brown-chair-2' }),
      });
    });

    it('rejects a duplicate explicit slug', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'other' });

      await expect(
        service.create({ name: 'Chair', slug: 'plastic-chair' }, 'admin-1'),
      ).rejects.toThrow(ConflictException);

      expect(prisma.product.create).not.toHaveBeenCalled();
    });

    it('invalidates the public cache after creating', async () => {
      prisma.product.count.mockResolvedValue(0);
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.findUnique.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue(
        buildProduct({ status: ProductStatus.ACTIVE }),
      );

      await service.findAllPublic();
      await service.create(
        { name: 'New Chair', status: ProductStatus.ACTIVE },
        'admin-1',
      );
      await service.findAllPublic();

      expect(prisma.product.findMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('update', () => {
    it('updates only the provided fields', async () => {
      prisma.product.findUnique.mockResolvedValue(buildProduct());
      prisma.product.update.mockResolvedValue(
        buildProduct({ name: 'New name' }),
      );

      await service.update('product-1', { name: 'New name' });

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: { name: 'New name' },
      });
    });

    it('rejects a slug already used by another product', async () => {
      prisma.product.findUnique
        .mockResolvedValueOnce(buildProduct())
        .mockResolvedValueOnce({ id: 'other' });

      await expect(
        service.update('product-1', { slug: 'taken-slug' }),
      ).rejects.toThrow(ConflictException);
    });

    it('refuses to update a soft-deleted product', async () => {
      prisma.product.findUnique.mockResolvedValue(
        buildProduct({ deletedAt: new Date() }),
      );

      await expect(
        service.update('product-1', { name: 'Nope' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFound for a missing product', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.update('missing', { name: 'Nope' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('status changes', () => {
    it('publishes a product', async () => {
      prisma.product.findUnique.mockResolvedValue(
        buildProduct({ status: ProductStatus.DRAFT }),
      );
      prisma.product.update.mockResolvedValue(
        buildProduct({ status: ProductStatus.ACTIVE }),
      );

      const result = await service.publish('product-1');

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: { status: ProductStatus.ACTIVE },
      });
      expect(result.status).toBe(ProductStatus.ACTIVE);
    });

    it('unpublishes a product', async () => {
      prisma.product.findUnique.mockResolvedValue(buildProduct());
      prisma.product.update.mockResolvedValue(
        buildProduct({ status: ProductStatus.DRAFT }),
      );

      await service.unpublish('product-1');

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: { status: ProductStatus.DRAFT },
      });
    });

    it('refuses to change the status of a deleted product', async () => {
      prisma.product.findUnique.mockResolvedValue(
        buildProduct({ deletedAt: new Date() }),
      );

      await expect(service.publish('product-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('soft deletes a product', async () => {
      prisma.product.findUnique.mockResolvedValue(buildProduct());

      await service.remove('product-1');

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: {
          deletedAt: expect.any(Date),
          status: ProductStatus.ARCHIVED,
        },
      });
    });

    it('refuses to soft delete twice', async () => {
      prisma.product.findUnique.mockResolvedValue(
        buildProduct({ deletedAt: new Date() }),
      );

      await expect(service.remove('product-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('hard deletes a product', async () => {
      prisma.product.findUnique.mockResolvedValue(buildProduct());

      await service.hardRemove('product-1');

      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: 'product-1' },
      });
    });

    it('throws NotFound when hard deleting a missing product', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.hardRemove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
