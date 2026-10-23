import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { QueryInquiriesDto } from './dto/query-inquiries.dto.js';
import { UpdateInquiryNoteDto } from './dto/update-inquiry-note.dto.js';
import { UpdateInquiryStatusDto } from './dto/update-inquiry-status.dto.js';
import { InquiriesService } from './inquiries.service.js';

@ApiTags('admin-inquiries')
@ApiBearerAuth()
@Roles(AdminRole.ADMIN)
@Controller('admin/inquiries')
export class AdminInquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Get()
  @ApiOperation({ summary: 'List inquiries (admin)' })
  async findAll(@Query() query: QueryInquiriesDto) {
    return this.inquiriesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an inquiry (admin)' })
  async findOne(@Param('id') id: string) {
    return this.inquiriesService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update the status of an inquiry (admin)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInquiryStatusDto,
  ) {
    return this.inquiriesService.updateStatus(id, dto.status);
  }

  @Patch(':id/note')
  @ApiOperation({ summary: 'Update the internal note of an inquiry (admin)' })
  async updateNote(@Param('id') id: string, @Body() dto: UpdateInquiryNoteDto) {
    return this.inquiriesService.updateNote(id, dto.note);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an inquiry (admin)' })
  async remove(@Param('id') id: string) {
    await this.inquiriesService.remove(id);
  }
}
