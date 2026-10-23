import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateInquiryNoteDto {
  @ApiPropertyOptional({
    description: 'Internal note. Send an empty string to clear it.',
    maxLength: 5000,
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(5000)
  note?: string;
}
