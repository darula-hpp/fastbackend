import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = join(__dirname, '..', '..', 'dist', 'index.js');

describe('FastBackend E2E', () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), 'fastbackend-e2e-'));
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  it('should complete init → generate workflow', () => {
    execSync(`node "${CLI}" init my-api --schema sqlalchemy --adapter fastapi`, {
      cwd: projectDir,
      stdio: 'pipe',
    });

    const apiDir = join(projectDir, 'my-api');
    expect(existsSync(join(apiDir, 'fastbackend.yaml'))).toBe(true);
    expect(existsSync(join(apiDir, 'models.py'))).toBe(true);
    expect(existsSync(join(apiDir, 'app', 'custom'))).toBe(true);

    execSync(`node "${CLI}" generate`, { cwd: apiDir, stdio: 'pipe' });

    const irPath = join(apiDir, '.fastbackend', 'ir.json');
    const openapiPath = join(apiDir, '.fastbackend', 'openapi.yaml');

    expect(existsSync(irPath)).toBe(true);
    expect(existsSync(openapiPath)).toBe(true);

    const ir = JSON.parse(readFileSync(irPath, 'utf-8'));
    expect(ir.version).toBe('1.0.0');
    expect(ir.entities.length).toBeGreaterThanOrEqual(2);
    expect(ir.relationships.length).toBeGreaterThanOrEqual(1);

    const openapi = readFileSync(openapiPath, 'utf-8');
    expect(openapi).toContain('/users');
    expect(openapi).toContain('/health');
  });

  it('should include custom endpoints in OpenAPI', () => {
    execSync(`node "${CLI}" init my-api --schema sqlalchemy --adapter fastapi`, {
      cwd: projectDir,
      stdio: 'pipe',
    });

    const apiDir = join(projectDir, 'my-api');
    execSync(`node "${CLI}" generate`, { cwd: apiDir, stdio: 'pipe' });

    const openapi = readFileSync(join(apiDir, '.fastbackend', 'openapi.yaml'), 'utf-8');
    expect(openapi).toContain('/health/custom');
  });

  it('should scaffold and generate a Prisma project', () => {
    execSync(`node "${CLI}" init prisma-api --schema prisma --adapter fastapi`, {
      cwd: projectDir,
      stdio: 'pipe',
    });

    const apiDir = join(projectDir, 'prisma-api');
    expect(existsSync(join(apiDir, 'schema.prisma'))).toBe(true);
    expect(existsSync(join(apiDir, 'models.py'))).toBe(false);

    execSync(`node "${CLI}" generate`, { cwd: apiDir, stdio: 'pipe' });

    const ir = JSON.parse(readFileSync(join(apiDir, '.fastbackend', 'ir.json'), 'utf-8'));
    expect(ir.metadata.schemaFormat).toBe('prisma');
    expect(ir.entities.length).toBeGreaterThanOrEqual(2);
  });

  it('should scaffold Docker files with --docker', () => {
    execSync(`node "${CLI}" init docker-api --schema sqlalchemy --adapter fastapi --docker`, {
      cwd: projectDir,
      stdio: 'pipe',
    });

    const apiDir = join(projectDir, 'docker-api');
    expect(existsSync(join(apiDir, 'Dockerfile'))).toBe(true);
    expect(existsSync(join(apiDir, 'docker-compose.yml'))).toBe(true);
  });
});
