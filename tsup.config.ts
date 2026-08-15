import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'format/index': 'src/format/index.ts',
    'tz/index': 'src/tz/index.ts',
    'intl/index': 'src/intl/index.ts',
    'relative/index': 'src/relative/index.ts',
    'compat/moment/index': 'src/compat/moment/index.ts',
    'temporal/index': 'src/temporal/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  target: 'es2022',
});
