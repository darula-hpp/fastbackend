import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ConfigLoader } from '../loader.js';
import { ConfigValidationError } from '../../errors/index.js';

describe('ConfigLoader', () => {
  let tempDir: string;
  let loader: ConfigLoader;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'fastbackend-config-'));
    loader = new ConfigLoader();
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    delete process.env.DB_HOST;
  });

  it('should load and parse YAML configuration', async () => {
    const configPath = join(tempDir, 'fastbackend.yaml');
    writeFileSync(
      configPath,
      `
project:
  name: my-api
  version: 1.0.0
schema:
  format: sqlalchemy
  path: models.py
adapter:
  name: fastapi
openapi:
  outputPath: .fastbackend/openapi.yaml
`,
    );

    const config = await loader.load(configPath);
    expect(config.project.name).toBe('my-api');
    expect(config.schema.format).toBe('sqlalchemy');
    expect(config.adapter.name).toBe('fastapi');
  });

  it('should resolve environment variables', () => {
    process.env.DB_HOST = 'localhost';
    const resolved = loader.resolveEnvVars({ db: { host: '${DB_HOST}' } });
    expect((resolved as { db: { host: string } }).db.host).toBe('localhost');
  });

  it('should throw error for missing environment variables', () => {
    expect(() => {
      loader.resolveEnvVars({ db: { host: '${MISSING_VAR}' } });
    }).toThrow(ConfigValidationError);
  });

  it('should throw error for missing config file', async () => {
    await expect(loader.load(join(tempDir, 'missing.yaml'))).rejects.toThrow(
      ConfigValidationError,
    );
  });

  it('should throw error for invalid config missing required fields', async () => {
    const configPath = join(tempDir, 'fastbackend.yaml');
    writeFileSync(configPath, 'project:\n  name: test\n');

    await expect(loader.load(configPath)).rejects.toThrow(ConfigValidationError);
  });
});
