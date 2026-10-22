import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './password.dto.js';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token from the password reset email' })
  @IsString()
  @MinLength(16)
  token: string;

  @ApiProperty({ example: 'Str0ngPassword!' })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(/[a-zA-Z]/, {
    message: 'password must contain at least one letter',
  })
  @Matches(/\d/, { message: 'password must contain at least one number' })
  password: string;
}
