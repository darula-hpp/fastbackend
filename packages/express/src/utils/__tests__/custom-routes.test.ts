import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { RouteRegistry } from '../route-registry.js';
import { registerCustomRoutes, scanOverrideMarkers } from '../custom-routes.js';

describe('custom routes', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'fb-custom-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('scans override markers from TypeScript custom files', () => {
    writeFileSync(
      join(tempDir, 'users.ts'),
      `@fastbackend.override('/users/{id}', 'GET')\nexport const router = null;`,
    );

    const registry = new RouteRegistry();
    scanOverrideMarkers(tempDir, registry);

    expect(registry.isOverridden('GET', '/users/{id}')).toBe(true);
  });

  it('skips override-only files when registering custom routes', async () => {
    writeFileSync(
      join(tempDir, 'override-only.ts'),
      `@fastbackend.override('/users/{id}', 'GET')
export const marker = true;`,
    );

    const app = express();
    const registry = new RouteRegistry();
    const count = await registerCustomRoutes(app, tempDir, registry);
    expect(count).toBe(0);
  });

  it('registers exported routers from custom directory', async () => {
    const customDir = join(tempDir, 'custom');
    mkdirSync(customDir, { recursive: true });
    writeFileSync(
      join(customDir, 'health.ts'),
      `export const router = (req: any, res: any, next: any) => {
  if (req.path === '/health/custom') {
    return res.status(200).json({ custom: 'ok' });
  }
  return next();
};`,
    );

    const app = express();
    const registry = new RouteRegistry();
    const count = await registerCustomRoutes(app, customDir, registry);

    expect(count).toBe(1);
    const response = await request(app).get('/health/custom');
    expect(response.status).toBe(200);
    expect(response.body.custom).toBe('ok');
  });
});
