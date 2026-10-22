import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/**
 * Password policy: at least 8 characters, containing at least one letter and
 * at least one number.
 */
export class PasswordDto {
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
