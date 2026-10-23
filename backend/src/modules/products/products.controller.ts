import { Controller, Get, HttpStatus, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { createHash } from 'crypto';
import { ProductsService } from './products.service.js';
import { Public } from '../../common/decorators/public.decorator.js';

/**
 * Public marketing endpoints.
 *
 * These are served from the server root (no `/api/v1` prefix) because the
 * frontend calls them with `VITE_API_BASE_URL` as the base, e.g.
 * `GET ${base}/products`.
 */
@ApiTags('products')
@Controller('products')
export class ProductsController {
  private readonly listMaxAge: number;
  private readonly detailMaxAge: number;

  constructor(
    private readonly productsService: ProductsService,
    configService: ConfigService,
  ) {
    this.listMaxAge =
      configService.get<number>('cache.productListTtlSeconds') ?? 60;
    this.detailMaxAge =
      configService.get<number>('cache.productDetailTtlSeconds') ?? 300;
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published products (public)' })
  async findAll(@Res() res: Response) {
    const result = await this.productsService.findAllPublic();

    return this.sendCached(res, result, this.listMaxAge);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'List best selling products (public)' })
  async findFeatured(@Res() res: Response) {
    const result = await this.productsService.findFeaturedPublic();

    return this.sendCached(res, result, this.listMaxAge);
  }

  @Public()
  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get a published product by ID or slug (public)' })
  async findOne(@Param('idOrSlug') idOrSlug: string, @Res() res: Response) {
    const result = await this.productsService.findOnePublic(idOrSlug);

    return this.sendCached(res, result, this.detailMaxAge);
  }

  private async sendCached(
    res: Response,
    result: unknown,
    maxAge: number,
  ): Promise<Response> {
    const etag = this.generateEtag(result);

    res.setHeader(
      'Cache-Control',
      `public, max-age=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
    );
    res.setHeader('ETag', etag);

    if (this.etagMatches(res.req.headers['if-none-match'], etag)) {
      return res.status(HttpStatus.NOT_MODIFIED).send();
    }

    return res.json(result);
  }

  private etagMatches(ifNoneMatch: string | undefined, etag: string): boolean {
    if (!ifNoneMatch) {
      return false;
    }

    return ifNoneMatch
      .split(',')
      .map((value) => value.trim())
      .some((value) => value === etag || value === '*');
  }

  private generateEtag(data: unknown): string {
    const hash = createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
    return `W/"${hash}"`;
  }
}
