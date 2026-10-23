import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InquiryStatus } from '@prisma/client';

export class UpdateInquiryStatusDto {
  @ApiProperty({ enum: InquiryStatus })
  @IsEnum(InquiryStatus)
  status: InquiryStatus;
}
