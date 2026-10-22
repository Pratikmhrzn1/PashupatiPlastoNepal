import { plainToInstance } from 'class-transformer';
import { IsBooleanString, IsEnum, IsNumber, IsOptional, IsString, IsUrl, MinLength, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  PORT: number = 4000;

  @IsString()
  API_PREFIX: string = '/api/v1';

  @IsUrl({ require_tld: false })
  FRONTEND_URL: string;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  @IsOptional()
  REDIS_URL?: string;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET: string;

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET: string;

  @IsString()
  JWT_ACCESS_EXPIRES_IN: string = '15m';

  @IsString()
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  @IsString()
  ADMIN_EMAIL: string;

  @IsString()
  @MinLength(8)
  ADMIN_PASSWORD: string;

  @IsString()
  @IsOptional()
  RESEND_API_KEY?: string;

  @IsString()
  MAIL_FROM: string;

  @IsString()
  @IsOptional()
  MAIL_FROM_NAME?: string;

  @IsBooleanString()
  @IsOptional()
  ENABLE_TURNSTILE?: string = 'false';

  @IsString()
  @IsOptional()
  TURNSTILE_SECRET_KEY?: string;

  @IsNumber()
  @IsOptional()
  RATE_LIMIT_TTL?: number = 60;

  @IsNumber()
  @IsOptional()
  RATE_LIMIT_LIMIT?: number = 100;

  @IsString()
  @IsOptional()
  CACHE_NAMESPACE?: string = 'pashupati';

  @IsNumber()
  @IsOptional()
  PRODUCT_CACHE_TTL_SECONDS?: number = 60;

  @IsNumber()
  @IsOptional()
  PRODUCT_DETAIL_CACHE_TTL_SECONDS?: number = 300;

  @IsNumber()
  @IsOptional()
  AUTH_RATE_LIMIT_TTL?: number = 60;

  @IsNumber()
  @IsOptional()
  AUTH_RATE_LIMIT_LIMIT?: number = 5;

  @IsNumber()
  @IsOptional()
  MAX_LOGIN_ATTEMPTS?: number = 5;

  @IsNumber()
  @IsOptional()
  LOCKOUT_DURATION_MS?: number = 900000;

  @IsNumber()
  @IsOptional()
  PASSWORD_RATE_LIMIT_TTL?: number = 900;

  @IsNumber()
  @IsOptional()
  PASSWORD_RATE_LIMIT_LIMIT?: number = 3;

  @IsNumber()
  @IsOptional()
  VERIFICATION_RATE_LIMIT_TTL?: number = 900;

  @IsNumber()
  @IsOptional()
  VERIFICATION_RATE_LIMIT_LIMIT?: number = 5;

  @IsNumber()
  @IsOptional()
  EMAIL_VERIFICATION_TTL_HOURS?: number = 24;

  @IsNumber()
  @IsOptional()
  PASSWORD_RESET_TTL_MINUTES?: number = 60;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
