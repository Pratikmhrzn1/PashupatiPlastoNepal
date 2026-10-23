export default () => ({
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT || '4000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  frontendUrl: process.env.FRONTEND_URL,
  site: {
    featuredProductLimit: parseInt(
      process.env.FEATURED_PRODUCT_LIMIT || '4',
      10,
    ),
    publicProductLimit: parseInt(process.env.PUBLIC_PRODUCT_LIMIT || '200', 10),
  },
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
  mail: {
    resendApiKey: process.env.RESEND_API_KEY,
    from: process.env.MAIL_FROM || 'no-reply@localhost',
    fromName: process.env.MAIL_FROM_NAME,
  },
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10) * 1000,
    limit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
  },
  cache: {
    namespace: process.env.CACHE_NAMESPACE || 'pashupati',
    productListTtlSeconds: parseInt(
      process.env.PRODUCT_CACHE_TTL_SECONDS || '60',
      10,
    ),
    productDetailTtlSeconds: parseInt(
      process.env.PRODUCT_DETAIL_CACHE_TTL_SECONDS || '300',
      10,
    ),
  },
  security: {
    enableTurnstile: process.env.ENABLE_TURNSTILE === 'true',
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY,
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    rateLimitLimit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockoutDurationMs: parseInt(
      process.env.LOCKOUT_DURATION_MS || `${15 * 60 * 1000}`,
      10,
    ),
    authRateLimitLimit: parseInt(process.env.AUTH_RATE_LIMIT_LIMIT || '5', 10),
    authRateLimitTtl:
      parseInt(process.env.AUTH_RATE_LIMIT_TTL || '60', 10) * 1000,
    passwordRateLimitLimit: parseInt(
      process.env.PASSWORD_RATE_LIMIT_LIMIT || '3',
      10,
    ),
    passwordRateLimitTtl:
      parseInt(process.env.PASSWORD_RATE_LIMIT_TTL || '900', 10) * 1000,
    verificationRateLimitLimit: parseInt(
      process.env.VERIFICATION_RATE_LIMIT_LIMIT || '5',
      10,
    ),
    inquiryRateLimitLimit: parseInt(
      process.env.INQUIRY_RATE_LIMIT_LIMIT || '5',
      10,
    ),
    inquiryRateLimitTtl:
      parseInt(process.env.INQUIRY_RATE_LIMIT_TTL || '600', 10) * 1000,
    turnstileVerifyUrl: process.env.TURNSTILE_VERIFY_URL,
    verificationRateLimitTtl:
      parseInt(process.env.VERIFICATION_RATE_LIMIT_TTL || '900', 10) * 1000,
    emailVerificationTtlHours: parseInt(
      process.env.EMAIL_VERIFICATION_TTL_HOURS || '24',
      10,
    ),
    passwordResetTtlMinutes: parseInt(
      process.env.PASSWORD_RESET_TTL_MINUTES || '60',
      10,
    ),
  },
  inquiry: {
    notifyEmail:
      process.env.INQUIRY_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || '',
    autoConfirm: process.env.INQUIRY_AUTO_CONFIRM === 'true',
  },
  adminSeed: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
});
