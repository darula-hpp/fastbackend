import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SubprocessRunner } from '../subprocess-runner.js';

describe('SubprocessRunner extended', () => {
  const runner = new SubprocessRunner();

  it('should parse valid JSON via spawnAndParse', async () => {
    const result = await runner.spawnAndParse('node', [
      '-e',
      'console.log(JSON.stringify({entities:[],relationships:[]}))',
    ]);
    expect(result.data).toBeDefined();
  });

  it('should reject invalid JSON from spawnAndParse', async () => {
    await expect(
      runner.spawnAndParse('node', ['-e', 'console.log("not json")']),
    ).rejects.toThrow();
  });

  it('should handle spawn process errors', async () => {
    await expect(
      runner.spawn('nonexistent-command-xyz', []),
    ).rejects.toThrow();
  });
});
