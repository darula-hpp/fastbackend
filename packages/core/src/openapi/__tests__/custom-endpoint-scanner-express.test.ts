import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CustomEndpointScanner } from '../custom-endpoint-scanner.js';
import type { OpenAPISpec } from '../generator.js';

describe('CustomEndpointScanner express adapter', () => {
  let tempDir: string;
  const scanner = new CustomEndpointScanner('express');

  const baseSpec: OpenAPISpec = {
    openapi: '3.1.0',
    info: { title: 'test', version: '1.0.0' },
    paths: {
      '/users/{id}': {
        get: { tags: ['User'], responses: { '200': { description: 'ok' } } },
      },
    },
    components: { schemas: {} },
  };

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'fb-express-scan-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('merges Express custom routes into OpenAPI', () => {
    writeFileSync(
      join(tempDir, 'email.ts'),
      `import { Router } from 'express';
export const router = Router();
router.post('/users/:userId/send-email', (_req, res) => res.json({ status: 'sent' }));`,
    );

    const merged = scanner.mergeCustomEndpoints(baseSpec, tempDir);
    expect(merged.paths['/users/:userId/send-email']?.post).toBeDefined();
  });

  it('marks overridden Express routes in merged OpenAPI', () => {
    writeFileSync(
      join(tempDir, 'users.ts'),
      `@fastbackend.override('/users/{id}', 'GET')
import { Router } from 'express';
export const router = Router();`,
    );

    const merged = scanner.mergeCustomEndpoints(baseSpec, tempDir);
    expect(merged.paths['/users/{id}'].get?.['x-fastbackend-override']).toBe(true);
  });
});
