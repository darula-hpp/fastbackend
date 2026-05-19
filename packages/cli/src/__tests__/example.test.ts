import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXAMPLES_ROOT = join(__dirname, '..', '..', '..', '..', 'examples');
const CLI = join(__dirname, '..', '..', 'dist', 'index.js');

function stripGeneratedAt(ir: Record<string, unknown>): Record<string, unknown> {
  const copy = structuredClone(ir);
  if (copy.metadata && typeof copy.metadata === 'object') {
    delete (copy.metadata as Record<string, unknown>).generatedAt;
  }
  return copy;
}

function countOpenApiPaths(openapi: string): number {
  const match = openapi.match(/^paths:\s*$/m);
  if (!match) return 0;
  return (openapi.match(/^\s+\/\S+:/gm) ?? []).length;
}

describe('sqlalchemy-fastapi example', () => {
  const EXAMPLE_DIR = join(EXAMPLES_ROOT, 'sqlalchemy-fastapi');

  it('contains required project files', () => {
    expect(existsSync(join(EXAMPLE_DIR, 'models.py'))).toBe(true);
    expect(existsSync(join(EXAMPLE_DIR, 'fastbackend.yaml'))).toBe(true);
    expect(existsSync(join(EXAMPLE_DIR, 'main.py'))).toBe(true);
    expect(existsSync(join(EXAMPLE_DIR, 'app', 'custom', 'health.py'))).toBe(true);
    expect(existsSync(join(EXAMPLE_DIR, 'reference', 'ir.json'))).toBe(true);
  });

  it('generates IR and OpenAPI matching reference output', () => {
    execSync(`node "${CLI}" generate`, { cwd: EXAMPLE_DIR, stdio: 'pipe' });

    const irPath = join(EXAMPLE_DIR, '.fastbackend', 'ir.json');
    const openapiPath = join(EXAMPLE_DIR, '.fastbackend', 'openapi.yaml');
    const referenceIrPath = join(EXAMPLE_DIR, 'reference', 'ir.json');
    const referenceOpenapiPath = join(EXAMPLE_DIR, 'reference', 'openapi.yaml');

    expect(existsSync(irPath)).toBe(true);
    expect(existsSync(openapiPath)).toBe(true);

    const ir = JSON.parse(readFileSync(irPath, 'utf-8'));
    const referenceIr = JSON.parse(readFileSync(referenceIrPath, 'utf-8'));

    expect(stripGeneratedAt(ir)).toEqual(stripGeneratedAt(referenceIr));
    expect(ir.metadata.generatedAt).toBeTruthy();

    const openapi = readFileSync(openapiPath, 'utf-8');
    const referenceOpenapi = readFileSync(referenceOpenapiPath, 'utf-8');

    expect(countOpenApiPaths(openapi)).toBe(countOpenApiPaths(referenceOpenapi));
    expect(openapi).toContain('/users/{id}/posts');
    expect(openapi).toContain('/health/custom');
  });
});

describe('prisma-fastapi example', () => {
  const EXAMPLE_DIR = join(EXAMPLES_ROOT, 'prisma-fastapi');

  it('contains required project files', () => {
    expect(existsSync(join(EXAMPLE_DIR, 'schema.prisma'))).toBe(true);
    expect(existsSync(join(EXAMPLE_DIR, 'fastbackend.yaml'))).toBe(true);
    expect(existsSync(join(EXAMPLE_DIR, 'main.py'))).toBe(true);
    expect(existsSync(join(EXAMPLE_DIR, 'app', 'custom', 'health.py'))).toBe(true);
  });

  it('generates IR and OpenAPI from Prisma schema', () => {
    execSync(`node "${CLI}" generate`, { cwd: EXAMPLE_DIR, stdio: 'pipe' });

    const irPath = join(EXAMPLE_DIR, '.fastbackend', 'ir.json');
    const openapiPath = join(EXAMPLE_DIR, '.fastbackend', 'openapi.yaml');

    expect(existsSync(irPath)).toBe(true);
    expect(existsSync(openapiPath)).toBe(true);

    const ir = JSON.parse(readFileSync(irPath, 'utf-8'));
    expect(ir.metadata.schemaFormat).toBe('prisma');
    expect(ir.entities.some((e: { name: string }) => e.name === 'User')).toBe(true);
    expect(ir.entities.some((e: { name: string }) => e.name === 'Post')).toBe(true);
    expect(ir.relationships.length).toBeGreaterThanOrEqual(1);

    const openapi = readFileSync(openapiPath, 'utf-8');
    expect(openapi).toContain('/users');
    expect(openapi).toContain('/posts');
    expect(openapi).toContain('/health/custom');
  });
});
