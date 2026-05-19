import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Logger } from '../logger.js';
import { ensureDir, writeFile, fileExists, getProjectPaths } from '../file-ops.js';
import { scaffoldProject } from '../scaffold.js';

describe('Logger', () => {
  it('should not output debug when debug is disabled', () => {
    const logger = new Logger();
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.debug('hidden');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should output debug when debug is enabled', () => {
    const logger = new Logger();
    logger.setDebug(true);
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.debug('visible');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('file-ops', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'fb-fileops-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should create directories and write files', () => {
    const filePath = join(tempDir, 'nested', 'file.txt');
    writeFile(filePath, 'content');
    expect(existsSync(filePath)).toBe(true);
  });

  it('should check file existence', () => {
    expect(fileExists(tempDir)).toBe(true);
    expect(fileExists(join(tempDir, 'missing'))).toBe(false);
  });

  it('should return project paths', () => {
    const paths = getProjectPaths('/project');
    expect(paths.config).toContain('fastbackend.yaml');
    expect(paths.ir).toContain('.fastbackend/ir.json');
  });

  it('ensureDir creates nested directories', () => {
    const dir = join(tempDir, 'a', 'b', 'c');
    ensureDir(dir);
    expect(existsSync(dir)).toBe(true);
  });
});

describe('scaffoldProject', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'fb-scaffold-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should scaffold a complete project', () => {
    const created = scaffoldProject(tempDir, {
      name: 'test-api',
      schema: 'sqlalchemy',
      adapter: 'fastapi',
    });

    expect(created.length).toBeGreaterThan(5);
    expect(existsSync(join(tempDir, 'fastbackend.yaml'))).toBe(true);
    expect(existsSync(join(tempDir, 'models.py'))).toBe(true);
    expect(existsSync(join(tempDir, 'app', 'custom', 'health.py'))).toBe(true);
    expect(existsSync(join(tempDir, 'tests', 'conftest.py'))).toBe(true);
    expect(existsSync(join(tempDir, 'tests', 'test_health.py'))).toBe(true);
  });

  it('should include Docker files when requested', () => {
    scaffoldProject(tempDir, {
      name: 'test-api',
      schema: 'sqlalchemy',
      adapter: 'fastapi',
      docker: true,
    });

    expect(existsSync(join(tempDir, 'Dockerfile'))).toBe(true);
    expect(existsSync(join(tempDir, 'docker-compose.yml'))).toBe(true);
  });

  it('should scaffold Prisma schema when format is prisma', () => {
    const created = scaffoldProject(tempDir, {
      name: 'prisma-api',
      schema: 'prisma',
      adapter: 'fastapi',
    });

    expect(created).toContain('schema.prisma');
    expect(existsSync(join(tempDir, 'schema.prisma'))).toBe(true);
    expect(existsSync(join(tempDir, 'models.py'))).toBe(false);

    const config = readFileSync(join(tempDir, 'fastbackend.yaml'), 'utf-8');
    expect(config).toContain('format: prisma');
    expect(config).toContain('path: schema.prisma');
  });
});
