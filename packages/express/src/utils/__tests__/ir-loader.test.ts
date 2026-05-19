import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadIr } from '../ir-loader.js';
import { SAMPLE_IR } from '../../__tests__/fixtures/mock-prisma.js';

describe('loadIr', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'fb-ir-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('loads valid IR JSON from disk', () => {
    const path = join(tempDir, 'ir.json');
    writeFileSync(path, JSON.stringify(SAMPLE_IR));

    const ir = loadIr(path);
    expect(ir.entities).toHaveLength(2);
    expect(ir.metadata.adapter).toBe('express');
  });

  it('throws when IR file is missing', () => {
    expect(() => loadIr(join(tempDir, 'missing.json'))).toThrow(/not found/);
  });

  it('throws when IR is malformed', () => {
    const path = join(tempDir, 'bad.json');
    writeFileSync(path, JSON.stringify({ version: '1.0.0' }));
    expect(() => loadIr(path)).toThrow(/Invalid IR/);
  });
});
