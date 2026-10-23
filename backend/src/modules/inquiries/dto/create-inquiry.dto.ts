import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateInquiryDto {
  @ApiProperty({ maxLength: 100, example: 'Ram Bahadur' })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ maxLength: 200, example: 'ram@example.com' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(200)
  email: string;

  @ApiPropertyOptional({ maxLength: 30, example: '+977-98XXXXXXXX' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({
    maxLength: 200,
    example: 'Bulk order of plastic chairs',
    description:
      'Optional. Website enquiries are stored with a default subject when omitted.',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  subject?: string;

  @ApiProperty({ maxLength: 5000 })
  @Transform(trim)
  @IsString()
  @MinLength(5)
  @MaxLength(5000)
  message: string;

  @ApiPropertyOptional({
    description: 'Product the inquiry is about.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({
    description:
      'Honeypot field. Bots fill it in; humans never see it. Must stay empty.',
    writeOnly: true,
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  website?: string;

  @ApiPropertyOptional({
    description: 'Cloudflare Turnstile token, required when Turnstile is on.',
    writeOnly: true,
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2048)
  turnstileToken?: string;
}
