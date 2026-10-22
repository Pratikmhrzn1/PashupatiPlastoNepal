import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ description: 'Token from the verification email' })
  @IsString()
  @MinLength(16)
  token: string;
}
