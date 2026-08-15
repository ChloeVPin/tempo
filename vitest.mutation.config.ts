import { defineConfig } from 'vitest/config';

/**
 * Scoped vitest config used by Stryker mutation runs on `src/core/civil.ts`:
 * only the suites that exercise the civil calendar math. Keeps each mutant
 * verification run fast. Used by `npm run test:mutation` (stryker.config.json).
 */
export default defineConfig({
  test: {
    include: [
      'tests/unit/civil.test.ts',
      'tests/unit/civil-walk.test.ts',
      'tests/property/civil.property.test.ts',
      'tests/unit/local-date.test.ts',
      'tests/unit/local-datetime.test.ts',
    ],
  },
});
