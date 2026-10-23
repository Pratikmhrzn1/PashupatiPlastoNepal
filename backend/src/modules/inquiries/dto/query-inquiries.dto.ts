import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { InquiryStatus } from '@prisma/client';

export const INQUIRY_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'name',
  'status',
] as const;

export type InquirySortField = (typeof INQUIRY_SORT_FIELDS)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;

export type SortOrder = (typeof SORT_ORDERS)[number];

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class QueryInquiriesDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: DEFAULT_PAGE_SIZE, maximum: MAX_PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit: number = DEFAULT_PAGE_SIZE;

  @ApiPropertyOptional({ enum: InquiryStatus })
  @IsOptional()
  @IsIn(Object.values(InquiryStatus))
  status?: InquiryStatus;

  @ApiPropertyOptional({
    description: 'Case-insensitive search in name, email, subject and message',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({ enum: INQUIRY_SORT_FIELDS, default: 'createdAt' })
  @IsOptional()
  @IsIn(INQUIRY_SORT_FIELDS)
  sort: InquirySortField = 'createdAt';

  @ApiPropertyOptional({ enum: SORT_ORDERS, default: 'desc' })
  @IsOptional()
  @IsIn(SORT_ORDERS)
  order: SortOrder = 'desc';
}
