import { describe, it, expect } from 'vitest';
import { getRuntimeAdapter, validateAdapterSchemaPair } from '../adapters.js';

describe('runtime adapters', () => {
  it('returns fastapi adapter metadata', () => {
    const adapter = getRuntimeAdapter('fastapi');
    expect(adapter.language).toBe('python');
    expect(adapter.supportedSchemaFormats).toContain('sqlalchemy');
  });

  it('returns express adapter metadata', () => {
    const adapter = getRuntimeAdapter('express');
    expect(adapter.language).toBe('typescript');
    expect(adapter.supportedSchemaFormats).toEqual(['prisma']);
    expect(adapter.customPath).toBe('src/custom');
  });

  it('rejects incompatible adapter and schema pairs', () => {
    expect(() => validateAdapterSchemaPair('express', 'sqlalchemy')).toThrow(
      /does not support schema format/,
    );
  });

  it('allows express with prisma', () => {
    expect(() => validateAdapterSchemaPair('express', 'prisma')).not.toThrow();
  });
});
