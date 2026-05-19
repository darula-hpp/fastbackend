import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadProjectEnv, applyProjectEnv } from '../load-project-env.js';

describe('loadProjectEnv', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'fb-env-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    delete process.env.DATABASE_URL;
  });

  it('loads variables from .env without overriding existing process env', () => {
    process.env.DATABASE_URL = 'postgresql://existing';

    writeFileSync(
      join(tempDir, '.env'),
      `# comment
DATABASE_URL=postgresql://from-file
PORT=3001
`,
    );

    const env = loadProjectEnv(tempDir);
    expect(env.DATABASE_URL).toBe('postgresql://existing');
    expect(env.PORT).toBe('3001');
  });

  it('returns process env when .env is missing', () => {
    process.env.DATABASE_URL = 'postgresql://existing';
    const env = loadProjectEnv(tempDir);
    expect(env.DATABASE_URL).toBe('postgresql://existing');
  });

  it('applyProjectEnv merges .env into process.env', () => {
    writeFileSync(join(tempDir, '.env'), 'PORT=3001\n');
    delete process.env.PORT;

    applyProjectEnv(tempDir);
    expect(process.env.PORT).toBe('3001');

    delete process.env.PORT;
  });
});
