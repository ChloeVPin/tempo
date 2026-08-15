import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    benchmark: {
      include: ['tests/bench/**/*.bench.ts'],
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts', 'src/iso/format.ts', 'src/types.ts', 'src/tz/types.ts'],
      thresholds: {
        lines: 74,
        functions: 62,
        branches: 72,
      },
    },
  },
});
