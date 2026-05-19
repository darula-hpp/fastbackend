import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const EXPRESS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('@fastbackend/express npm pack', () => {
  let packDir: string;
  let tarballPath: string;

  beforeAll(() => {
    execSync('pnpm build', { cwd: EXPRESS_DIR, stdio: 'pipe' });

    packDir = mkdtempSync(join(tmpdir(), 'fb-express-pack-'));
    execSync(`pnpm pack --pack-destination "${packDir}"`, {
      cwd: EXPRESS_DIR,
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

  it('includes runtime entrypoints and engine modules', () => {
    expect(existsSync(tarballPath)).toBe(true);

    const listing = execSync(`tar -tzf "${tarballPath}"`, { encoding: 'utf-8' });
    expect(listing).toContain('dist/index.js');
    expect(listing).toContain('dist/runtime.js');
    expect(listing).toContain('dist/engines/crud-engine.js');
    expect(listing).toContain('dist/engines/relationship-engine.js');
  });
});
