import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { ProductImagesService } from './product-images.service.js';
import { UploadProductImageDto } from './dto/upload-product-image.dto.js';

@ApiTags('admin-uploads')
@ApiBearerAuth()
@Roles(AdminRole.ADMIN)
@Controller('admin/uploads')
export class AdminUploadsController {
  constructor(private readonly productImagesService: ProductImagesService) {}

  @Post('product-image')
  @ApiOperation({ summary: 'Upload a product image from the admin panel' })
  async uploadProductImage(
    @Body() dto: UploadProductImageDto,
    @Req() request: Request,
  ) {
    const path = await this.productImagesService.saveProductImage(dto.data);
    const isAbsoluteUrl = /^https?:\/\//i.test(path);

    return {
      url: isAbsoluteUrl ? path : `${this.resolveOrigin(request)}${path}`,
      path,
    };
  }

  private resolveOrigin(request: Request): string {
    const configured = process.env.BACKEND_PUBLIC_URL?.replace(/\/$/, '');
    if (configured) return configured;

    const forwardedProto = request.get('x-forwarded-proto')?.split(',')[0]?.trim();
    const forwardedHost = request.get('x-forwarded-host')?.split(',')[0]?.trim();
    const protocol = forwardedProto || request.protocol;
    const host = forwardedHost || request.get('host');

    return `${protocol}://${host}`;
  }
}
