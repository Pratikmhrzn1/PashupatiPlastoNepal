import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { ProductsService } from './products.service.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AdminQueryProductsDto } from './dto/query-products.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

@ApiTags('admin-products')
@ApiBearerAuth()
@Roles(AdminRole.ADMIN)
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List all products, including soft-deleted (admin)' })
  async findAll(@Query() query: AdminQueryProductsDto) {
    return this.productsService.findAllAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID (admin)' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOneAdmin(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a product (admin)' })
  async create(
    @Body() dto: CreateProductDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.productsService.create(dto, adminId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product (admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish a product (admin)' })
  async publish(@Param('id') id: string) {
    return this.productsService.publish(id);
  }

  @Patch(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish a product (admin)' })
  async unpublish(@Param('id') id: string) {
    return this.productsService.unpublish(id);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive a product (admin)' })
  async archive(@Param('id') id: string) {
    return this.productsService.archive(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a product (admin)' })
  async remove(@Param('id') id: string) {
    await this.productsService.remove(id);
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete a product (admin)' })
  async hardRemove(@Param('id') id: string) {
    await this.productsService.hardRemove(id);
  }
}
