import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

export class UploadProductImageDto {
  @ApiProperty({
    description:
      'Image encoded as a data URL. PNG, JPEG and WebP are supported.',
    example: 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4...',
  })
  @IsString()
  @MaxLength(8_000_000)
  @Matches(/^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=\s]+$/i, {
    message: 'Image must be a PNG, JPEG or WebP data URL.',
  })
  data: string;
}
