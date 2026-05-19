import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CustomEndpointScanner } from '../custom-endpoint-scanner.js';
import type { OpenAPISpec } from '../generator.js';

describe('CustomEndpointScanner overrides', () => {
  let tempDir: string;
  const scanner = new CustomEndpointScanner();

  const baseSpec: OpenAPISpec = {
    openapi: '3.1.0',
    info: { title: 'test', version: '1.0.0' },
    paths: {
      '/users': {
        get: { tags: ['User'], responses: { '200': { description: 'ok' } } },
        post: { tags: ['User'], responses: { '201': { description: 'created' } } },
      },
    },
    components: { schemas: {} },
  };

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'fb-override-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should replace overridden endpoint in merged spec', () => {
    writeFileSync(
      join(tempDir, 'users_override.py'),
      `
@override("/users", "get")
@router.get("/users")
def custom_list_users():
    return []
`,
    );

    const merged = scanner.mergeCustomEndpoints(baseSpec, tempDir);
    expect(merged.paths['/users'].get?.['x-fastbackend-override']).toBe(true);
    expect(merged.paths['/users'].post).toBeDefined();
  });
});
