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

  it('exposes FastAPI documentation URLs for dev output', () => {
    const adapter = getRuntimeAdapter('fastapi');
    expect(adapter.getDevUrls?.(8301)).toEqual([
      { label: 'API', url: 'http://localhost:8301/' },
      { label: 'Documentation', url: 'http://localhost:8301/docs' },
      { label: 'ReDoc', url: 'http://localhost:8301/redoc' },
    ]);
  });

  it('does not define dev URLs for Express', () => {
    expect(getRuntimeAdapter('express').getDevUrls).toBeUndefined();
  });
});
