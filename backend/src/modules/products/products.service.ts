import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import { randomUUID } from 'crypto';
import { Prisma, Product, ProductStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { AdminQueryProductsDto } from './dto/query-products.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import {
  formatProductPrice,
  resolveProductImage,
} from './product-format.util.js';
import { getCatalogSoldCount } from './product-catalog.data.js';
import {
  AdminProductResponse,
  PaginatedProducts,
  ProductResponse,
  PublicProductResponse,
} from './product.types.js';

const extractImages = (images: Product['images']): string[] =>
  Array.isArray(images)
    ? images.filter((image): image is string => typeof image === 'string')
    : [];

const toProductResponse = (product: Product): ProductResponse => ({
  id: product.id,
  name: product.name,
  slug: product.slug,
  description: product.description,
  price: product.price === null ? null : Number(product.price),
  currency: product.currency,
  unit: product.unit,
  images: extractImages(product.images),
  category: product.category,
  status: product.status,
  featured: product.featured,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

const toAdminProductResponse = (product: Product): AdminProductResponse => ({
  ...toProductResponse(product),
  createdById: product.createdById,
  deletedAt: product.deletedAt,
});

@Injectable()
export class ProductsService {
  private readonly publicListTtlMs: number;
  private readonly publicDetailTtlMs: number;
  private readonly versionTtlMs: number;
  private readonly frontendUrl: string | undefined;
  private readonly publicProductLimit: number;
  private readonly featuredProductLimit: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {
    this.publicListTtlMs =
      (this.configService.get<number>('cache.productListTtlSeconds') ?? 60) *
      1000;
    this.publicDetailTtlMs =
      (this.configService.get<number>('cache.productDetailTtlSeconds') ?? 300) *
      1000;
    this.versionTtlMs = 24 * 60 * 60 * 1000;
    this.frontendUrl = this.configService.get<string>('frontendUrl');
    this.publicProductLimit =
      this.configService.get<number>('site.publicProductLimit') ?? 200;
    this.featuredProductLimit =
      this.configService.get<number>('site.featuredProductLimit') ?? 4;
  }

  private get publicListPrefix() {
    return 'products:public:list';
  }

  private get publicFeaturedPrefix() {
    return 'products:public:featured';
  }

  private get publicDetailPrefix() {
    return 'products:public:detail';
  }

  private get cacheVersionKey() {
    return 'products:public:version';
  }

  private async currentCacheVersion(): Promise<string> {
    const version = await this.cache.get<string>(this.cacheVersionKey);
    if (version) {
      return version;
    }

    const initial = 'initial';
    await this.cache.set(this.cacheVersionKey, initial, this.versionTtlMs);
    return initial;
  }

  private async buildPublicListKey() {
    const version = await this.currentCacheVersion();
    return `${this.publicListPrefix}:v${version}`;
  }

  private async buildPublicFeaturedKey() {
    const version = await this.currentCacheVersion();
    return `${this.publicFeaturedPrefix}:v${version}`;
  }

  private async buildPublicDetailKey(identifier: string) {
    const version = await this.currentCacheVersion();
    return `${this.publicDetailPrefix}:v${version}:${identifier}`;
  }

  /**
   * Maps a product row to the wire format the frontend consumes.
   */
  private toPublicProductResponse(product: Product): PublicProductResponse {
    const response: PublicProductResponse = {
      id: product.id,
      name: product.name,
      price: formatProductPrice(
        product.price === null ? null : Number(product.price),
        product.currency,
        product.unit,
      ),
      description: product.description ?? '',
    };

    const image = resolveProductImage(
      extractImages(product.images),
      this.frontendUrl,
    );

    if (image) {
      response.image = image;
    }

    const soldCount = getCatalogSoldCount(product.slug);

    if (soldCount !== undefined) {
      response.soldCount = soldCount;
    }

    return response;
  }

  /**
   * All published products, in catalog order.
   */
  async findAllPublic(): Promise<PublicProductResponse[]> {
    const key = await this.buildPublicListKey();
    const cached = await this.cache.get<PublicProductResponse[]>(key);

    if (cached) {
      return cached;
    }

    const products = await this.prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE, deletedAt: null },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: this.publicProductLimit,
    });

    const result = products.map((product) =>
      this.toPublicProductResponse(product),
    );

    await this.cache.set(key, result, this.publicListTtlMs);

    return result;
  }

  /**
   * Best selling products, ranked by the static catalog figures.
   */
  async findFeaturedPublic(): Promise<PublicProductResponse[]> {
    const key = await this.buildPublicFeaturedKey();
    const cached = await this.cache.get<PublicProductResponse[]>(key);

    if (cached) {
      return cached;
    }

    const products = await this.findAllPublic();
    const result = [...products]
      .sort((left, right) => (right.soldCount ?? 0) - (left.soldCount ?? 0))
      .slice(0, this.featuredProductLimit);

    await this.cache.set(key, result, this.publicListTtlMs);

    return result;
  }

  async findOnePublic(identifier: string): Promise<PublicProductResponse> {
    const key = await this.buildPublicDetailKey(identifier);
    const cached = await this.cache.get<PublicProductResponse>(key);

    if (cached) {
      return cached;
    }

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        identifier,
      );

    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.ACTIVE,
      deletedAt: null,
      ...(isUuid ? { id: identifier } : { slug: identifier }),
    };

    const product = await this.prisma.product.findFirst({ where });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const result = this.toPublicProductResponse(product);

    await this.cache.set(key, result, this.publicDetailTtlMs);

    return result;
  }

  async findAllAdmin(
    query: AdminQueryProductsDto,
  ): Promise<PaginatedProducts<AdminProductResponse>> {
    const where: Prisma.ProductWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (!query.includeDeleted) {
      where.deletedAt = null;
    }

    if (query.category) {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    if (query.featured !== undefined) {
      where.featured = query.featured;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      [query.sort]: query.order,
    };

    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    const totalPages = Math.ceil(total / query.limit);

    return {
      data: products.map((product) => toAdminProductResponse(product)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNextPage: query.page < totalPages,
        hasPreviousPage: query.page > 1,
      },
    };
  }

  async findOneAdmin(id: string): Promise<AdminProductResponse> {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return toAdminProductResponse(product);
  }

  async create(
    dto: CreateProductDto,
    createdById: string,
  ): Promise<AdminProductResponse> {
    const slug = dto.slug
      ? dto.slug.toLowerCase()
      : await this.generateUniqueSlug(dto.name);

    if (dto.slug) {
      await this.ensureSlugUnique(slug);
    }

    const product = await this.prisma.product
      .create({
        data: {
          name: dto.name,
          slug,
          description: dto.description ?? null,
          price: dto.price === undefined ? null : dto.price,
          currency: (dto.currency ?? 'NPR').toUpperCase(),
          unit: dto.unit ?? null,
          images: Array.isArray(dto.images) ? dto.images : [],
          category: dto.category ?? null,
          status: dto.status ?? ProductStatus.DRAFT,
          featured: dto.featured ?? false,
          createdById,
        },
      })
      .catch((error: unknown) => this.rethrowUniqueViolation(error));

    await this.invalidatePublicCache();

    return toAdminProductResponse(product);
  }

  async update(
    id: string,
    dto: UpdateProductDto,
  ): Promise<AdminProductResponse> {
    const existing = await this.prisma.product.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    if (existing.deletedAt) {
      throw new BadRequestException('Cannot update a deleted product');
    }

    let slug = existing.slug;
    if (dto.slug) {
      slug = dto.slug.toLowerCase();
      if (slug !== existing.slug) {
        await this.ensureSlugUnique(slug, id);
      }
    }

    const product = await this.prisma.product
      .update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.slug !== undefined ? { slug } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(dto.price !== undefined
            ? { price: dto.price === null ? null : dto.price }
            : {}),
          ...(dto.currency !== undefined
            ? { currency: dto.currency.toUpperCase() }
            : {}),
          ...(dto.unit !== undefined ? { unit: dto.unit } : {}),
          ...(dto.images !== undefined
            ? { images: Array.isArray(dto.images) ? dto.images : [] }
            : {}),
          ...(dto.category !== undefined ? { category: dto.category } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.featured !== undefined ? { featured: dto.featured } : {}),
        },
      })
      .catch((error: unknown) => this.rethrowUniqueViolation(error));

    await this.invalidatePublicCache();

    return toAdminProductResponse(product);
  }

  async publish(id: string): Promise<AdminProductResponse> {
    const product = await this.updateStatus(id, ProductStatus.ACTIVE);
    await this.invalidatePublicCache();

    return product;
  }

  async unpublish(id: string): Promise<AdminProductResponse> {
    const product = await this.updateStatus(id, ProductStatus.DRAFT);
    await this.invalidatePublicCache();

    return product;
  }

  async archive(id: string): Promise<AdminProductResponse> {
    const product = await this.updateStatus(id, ProductStatus.ARCHIVED);
    await this.invalidatePublicCache();

    return product;
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.product.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    if (existing.deletedAt) {
      throw new BadRequestException('Product already deleted');
    }

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: ProductStatus.ARCHIVED },
    });

    await this.invalidatePublicCache();
  }

  async hardRemove(id: string): Promise<void> {
    const existing = await this.prisma.product.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.delete({ where: { id } });

    await this.invalidatePublicCache();
  }

  private async updateStatus(
    id: string,
    status: ProductStatus,
  ): Promise<AdminProductResponse> {
    const existing = await this.prisma.product.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    if (existing.deletedAt) {
      throw new BadRequestException(
        'Cannot change status of a deleted product',
      );
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: { status },
    });

    return toAdminProductResponse(product);
  }

  private rethrowUniqueViolation(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('A product with this slug already exists');
    }

    throw error;
  }

  private async ensureSlugUnique(slug: string, excludeId?: string) {
    const existing = await this.prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existing && existing.id !== excludeId) {
      throw new ConflictException('A product with this slug already exists');
    }
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = this.slugify(name);
    let candidate = base;
    let suffix = 2;

    while (
      await this.prisma.product.findUnique({
        where: { slug: candidate },
        select: { id: true },
      })
    ) {
      candidate = `${base}-${suffix}`;
      suffix += 1;

      if (suffix > 100) {
        candidate = `${base}-${Date.now().toString(36)}`;
        break;
      }
    }

    return candidate;
  }

  private slugify(name: string): string {
    return (
      name
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'product'
    );
  }

  async invalidatePublicCache() {
    try {
      await this.cache.set(
        this.cacheVersionKey,
        randomUUID(),
        this.versionTtlMs,
      );
    } catch {
      // ignore cache failures
    }
  }
}
