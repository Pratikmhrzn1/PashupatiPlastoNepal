/**
 * Resolves the public web origin.
 *
 * `FRONTEND_URL` wins when set. On Vercel we can derive it from the deployment
 * host so a missing variable does not take the API down (CORS, email links).
 */
export function resolveFrontendUrl(): string {
  const configured = process.env.FRONTEND_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelHost) {
    return `https://${vercelHost.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
  }

  return 'http://localhost:3000';
}

/**
 * Resolves the runtime database URL.
 *
 * Supports the names injected by Vercel/Neon Postgres integrations so the app
 * works without manually duplicating the value into `DATABASE_URL`.
 */
export function resolveDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    undefined
  );
}
