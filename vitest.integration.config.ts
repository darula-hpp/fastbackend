import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/cli/src/__tests__/docker-integration.test.ts'],
    exclude: ['**/node_modules/**'],
    testTimeout: 300000,
  },
});
