import { describe, it, expect } from 'vitest';
import { getRuntimeAdapter } from '@fastbackend/core';
import { resolveDevPort } from '../dev.js';

describe('resolveDevPort', () => {
  const expressAdapter = getRuntimeAdapter('express');
  const config = {
    development: { watch: true, port: 3001, hotReload: true },
  } as Parameters<typeof resolveDevPort>[1];

  it('uses config development port when CLI port is omitted', () => {
    expect(resolveDevPort({}, config, expressAdapter)).toBe(3001);
  });

  it('prefers an explicit CLI port override', () => {
    expect(resolveDevPort({ port: 4000 }, config, expressAdapter)).toBe(4000);
  });

  it('falls back to adapter default when no ports are configured', () => {
    expect(resolveDevPort({}, {} as Parameters<typeof resolveDevPort>[1], expressAdapter)).toBe(3000);
  });
});
