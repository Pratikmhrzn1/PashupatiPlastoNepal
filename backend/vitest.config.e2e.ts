import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';

config({ path: '.env.test', override: true, quiet: true });

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: './test/global-setup.ts',
    // The e2e suite shares one Postgres database, so files run sequentially.
    fileParallelism: false,
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
});
