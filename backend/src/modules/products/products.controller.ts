import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { createHash } from 'crypto';
import { ProductsService } from './products.service.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { QueryProductsDto } from './dto/query-products.dto.js';

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
  @ApiOperation({ summary: 'List active products (public)' })
  async findAll(@Query() query: QueryProductsDto, @Res() res: Response) {
    const result = await this.productsService.findAllPublic(query);
    const etag = this.generateEtag(result);

    res.setHeader(
      'Cache-Control',
      `public, max-age=${this.listMaxAge}, stale-while-revalidate=${this.listMaxAge * 2}`,
    );
    res.setHeader('ETag', etag);

    if (this.etagMatches(res.req.headers['if-none-match'], etag)) {
      return res.status(HttpStatus.NOT_MODIFIED).send();
    }

    return res.json(result);
  }

  @Public()
  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get an active product by ID or slug (public)' })
  async findOne(@Param('idOrSlug') idOrSlug: string, @Res() res: Response) {
    const result = await this.productsService.findOnePublic(idOrSlug);
    const etag = this.generateEtag(result);

    res.setHeader(
      'Cache-Control',
      `public, max-age=${this.detailMaxAge}, stale-while-revalidate=${this.detailMaxAge * 2}`,
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
    const hash = createHash('sha256').update(JSON.stringify(data)).digest('hex');
    return `W/"${hash}"`;
  }
}
