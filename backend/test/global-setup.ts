import { execSync } from 'node:child_process';
import { config } from 'dotenv';

config({ path: '.env.test', override: true, quiet: true });

export async function setup(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.test.example to .env.test and configure it.',
    );
  }

  if (!process.env.DATABASE_URL.includes('test')) {
    throw new Error(
      'Refusing to run e2e tests against a non-test database URL. Set DATABASE_URL in .env.test to a database whose name contains "test".',
    );
  }

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
  });

  execSync('npx prisma db seed', {
    stdio: 'inherit',
    env: process.env,
  });
}

export async function teardown(): Promise<void> {
  // The test database is intentionally left in place for faster reruns.
}
