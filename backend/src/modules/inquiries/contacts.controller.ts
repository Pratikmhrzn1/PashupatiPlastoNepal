import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';
import { RateLimitScope } from '../../common/decorators/rate-limit-scope.decorator.js';
import { RateLimitGuard } from '../../common/guards/rate-limit.guard.js';
import { CreateInquiryDto } from './dto/create-inquiry.dto.js';
import { InquiriesService } from './inquiries.service.js';

/**
 * Public contact endpoint.
 *
 * Routed under /api via Vercel Services (single project). Frontend posts to `${VITE_API_BASE_URL}/api/contacts` and expects `{ ok: true }` with 201.
 */
@ApiTags('contacts')
@Controller('api/contacts')
export class ContactsController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimitScope('inquiry')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit the website contact form (public)' })
  async submit(@Body() dto: CreateInquiryDto, @Req() req: Request) {
    await this.inquiriesService.submit(dto, { ipAddress: req.ip });

    return { ok: true };
  }
}
