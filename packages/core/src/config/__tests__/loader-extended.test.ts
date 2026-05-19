import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ConfigLoader } from '../loader.js';

describe('ConfigLoader extended', () => {
  let tempDir: string;
  const loader = new ConfigLoader();

  const baseConfig = `
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
`;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'fb-config-ext-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should merge environment-specific config overlay', async () => {
    writeFileSync(join(tempDir, 'fastbackend.yaml'), baseConfig);
    writeFileSync(
      join(tempDir, 'fastbackend.dev.yaml'),
      `
development:
  watch: true
  port: 9000
  hotReload: false
openapi:
  title: Dev API
`,
    );

    const config = await loader.loadWithEnvironment(join(tempDir, 'fastbackend.yaml'), 'dev');
    expect(config.development?.port).toBe(9000);
    expect(config.openapi.title).toBe('Dev API');
    expect(config.project.name).toBe('my-api');
  });

  it('should return base config when env overlay missing', async () => {
    writeFileSync(join(tempDir, 'fastbackend.yaml'), baseConfig);
    const config = await loader.loadWithEnvironment(join(tempDir, 'fastbackend.yaml'), 'prod');
    expect(config.project.name).toBe('my-api');
  });

  it('should throw on invalid YAML', async () => {
    writeFileSync(join(tempDir, 'fastbackend.yaml'), ':\n  bad: [yaml');
    await expect(loader.load(join(tempDir, 'fastbackend.yaml'))).rejects.toThrow('Failed to parse YAML');
  });

  it('should throw when config root is not an object', async () => {
    writeFileSync(join(tempDir, 'fastbackend.yaml'), 'just a string');
    await expect(loader.load(join(tempDir, 'fastbackend.yaml'))).rejects.toThrow('must be a YAML object');
  });
});
