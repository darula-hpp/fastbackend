import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const CORE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('@fastbackend/core npm pack', () => {
  let packDir: string;
  let tarballPath: string;

  beforeAll(() => {
    execSync('pnpm build', { cwd: CORE_DIR, stdio: 'pipe' });

    packDir = mkdtempSync(join(tmpdir(), 'fb-core-pack-'));
    execSync(`pnpm pack --pack-destination "${packDir}"`, {
      cwd: CORE_DIR,
      stdio: 'pipe',
    });

    const tarballName = readdirSync(packDir).find((name) => name.endsWith('.tgz'));
    if (!tarballName) {
      throw new Error('pnpm pack did not produce a tarball');
    }
    tarballPath = join(packDir, tarballName);
  }, 60000);

  afterAll(() => {
    if (packDir) {
      rmSync(packDir, { recursive: true, force: true });
    }
  });

  it('includes colocated SQLAlchemy parser and IR schema assets', () => {
    expect(existsSync(tarballPath)).toBe(true);

    const listing = execSync(`tar -tzf "${tarballPath}"`, { encoding: 'utf-8' });
    expect(listing).toContain('dist/parsers/sqlalchemy/parser.py');
    expect(listing).toContain('dist/ir/schema.json');
  });
});
