import { plainToInstance } from 'class-transformer';
import {
  IsBooleanString,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  ValidateIf,
  validateSync,
} from 'class-validator';

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

  @ValidateIf((_, value) => Boolean(value && String(value).trim() !== ''))
  @IsUrl({ require_tld: false, require_protocol: false })
  @IsOptional()
  FRONTEND_URL?: string;

  @ValidateIf((_, value) => Boolean(value && String(value).trim() !== ''))
  @IsUrl({ require_tld: false, require_protocol: false })
  @IsOptional()
  BACKEND_PUBLIC_URL?: string;

  @IsString()
  @IsOptional()
  CORS_ORIGINS?: string;

  @IsIn(['lax', 'strict', 'none'])
  @IsOptional()
  COOKIE_SAME_SITE?: 'lax' | 'strict' | 'none';

  @ValidateIf(
    (env: EnvironmentVariables) =>
      !env.POSTGRES_PRISMA_URL &&
      !env.POSTGRES_URL &&
      !env.POSTGRES_URL_NON_POOLING,
  )
  @IsString({
    message:
      'DATABASE_URL must be set (or provide POSTGRES_PRISMA_URL / POSTGRES_URL from a Vercel/Neon Postgres integration)',
  })
  @IsNotEmpty()
  DATABASE_URL?: string;

  @IsString()
  @IsOptional()
  POSTGRES_PRISMA_URL?: string;

  @IsString()
  @IsOptional()
  POSTGRES_URL?: string;

  @IsString()
  @IsOptional()
  POSTGRES_URL_NON_POOLING?: string;

  @IsString()
  @IsOptional()
  REDIS_URL?: string;

  @IsString()
  @IsOptional()
  BLOB_READ_WRITE_TOKEN?: string;

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

  // Only used by the seed script; not required for the API to boot.
  @IsString()
  @IsOptional()
  ADMIN_EMAIL?: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  ADMIN_PASSWORD?: string;

  @IsString()
  @IsOptional()
  RESEND_API_KEY?: string;

  @IsString()
  @IsOptional()
  MAIL_FROM?: string;

  @IsString()
  @IsOptional()
  MAIL_FROM_NAME?: string;

  @IsBooleanString()
  @IsOptional()
  ENABLE_TURNSTILE?: string = 'false';

  @IsString()
  @IsOptional()
  TURNSTILE_SECRET_KEY?: string;

  @ValidateIf((_, value) => value !== undefined && value !== '')
  @IsUrl({ require_tld: false })
  @IsOptional()
  TURNSTILE_VERIFY_URL?: string;

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
  FEATURED_PRODUCT_LIMIT?: number = 4;

  @IsNumber()
  @IsOptional()
  PUBLIC_PRODUCT_LIMIT?: number = 200;

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
  INQUIRY_RATE_LIMIT_TTL?: number = 600;

  @IsNumber()
  @IsOptional()
  INQUIRY_RATE_LIMIT_LIMIT?: number = 5;

  @ValidateIf((_, value) => value !== undefined && value !== '')
  @IsEmail()
  @IsOptional()
  INQUIRY_NOTIFY_EMAIL?: string;

  @IsBooleanString()
  @IsOptional()
  INQUIRY_AUTO_CONFIRM?: string = 'false';

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

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
