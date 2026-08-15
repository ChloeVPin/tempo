import { defineConfig } from 'vitest/config';

/**
 * Runs only the Temporal differential suite with the pinned polyfill
 * injected, so the comparison executes deterministically even on hosts
 * without native Temporal. Used by the `temporal-diff` CI job:
 *
 *   npx vitest run --config vitest.temporal.config.ts
 */
export default defineConfig({
  test: {
    include: ['tests/differential/temporal.test.ts'],
    setupFiles: ['tests/setup/temporal-polyfill.ts'],
  },
});
