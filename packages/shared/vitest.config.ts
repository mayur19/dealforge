import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts', 'src/domain/pricing/types.ts'],
      // Money, pricing and approval logic is financial-critical (ADR-0013).
      thresholds: {
        'src/domain/**/*.ts': { lines: 100, branches: 100, functions: 100, statements: 100 },
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
