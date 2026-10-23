import { Module } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';
import { AdminProductsController } from './admin-products.controller.js';
import { AdminUploadsController } from './admin-uploads.controller.js';
import { ProductImagesService } from './product-images.service.js';

@Module({
  controllers: [
    ProductsController,
    AdminProductsController,
    AdminUploadsController,
  ],
  providers: [ProductsService, ProductImagesService],
  exports: [ProductsService],
})
export class ProductsModule {}
