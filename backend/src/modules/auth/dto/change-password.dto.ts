import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './password.dto.js';

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentPassword1!' })
  @IsString()
  @MinLength(1)
  currentPassword: string;

  @ApiProperty({ example: 'Str0ngPassword!' })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(/[a-zA-Z]/, {
    message: 'newPassword must contain at least one letter',
  })
  @Matches(/\d/, { message: 'newPassword must contain at least one number' })
  newPassword: string;
}
