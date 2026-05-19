import { describe, it, expect } from 'vitest';
import { SubprocessRunner } from '../subprocess-runner.js';
import { SubprocessError } from '../../errors/index.js';

describe('SubprocessRunner', () => {
  const runner = new SubprocessRunner();

  it('should spawn subprocess and capture stdout', async () => {
    const result = await runner.spawn('node', ['-e', 'console.log(JSON.stringify({entities:[],relationships:[]}))']);
    expect(result.success).toBe(true);
    expect(result.stdout).toContain('entities');
  });

  it('should handle subprocess errors gracefully', async () => {
    await expect(
      runner.spawn('node', ['-e', 'process.exit(1)']),
    ).rejects.toThrow(SubprocessError);
  });

  it('should validate JSON output from subprocess', () => {
    const result = runner.validateOutput('{"entities": [], "relationships": []}');
    expect(result.valid).toBe(true);
  });

  it('should reject invalid JSON output', () => {
    const result = runner.validateOutput('not json');
    expect(result.valid).toBe(false);
  });

  it('should reject JSON missing required fields', () => {
    const result = runner.validateOutput('{"foo": "bar"}');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('entities must be an array');
  });
});
