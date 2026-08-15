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
      exclude: [
        'src/**/index.ts',
        'src/temporal/**',
        'src/iso/format.ts',
        'src/types.ts',
        'src/tz/types.ts',
        'src/core/compare.ts',
      ],
      thresholds: {
        lines: 68,
        functions: 58,
        branches: 65,
      },
    },
  },
});
