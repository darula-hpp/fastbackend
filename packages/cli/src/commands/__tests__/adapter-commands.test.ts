import { describe, it, expect } from 'vitest';
import { getRuntimeAdapter } from '@fastbackend/core';

describe('runtime adapter CLI commands', () => {
  it('returns FastAPI dev and test commands', () => {
    const adapter = getRuntimeAdapter('fastapi');
    expect(adapter.getDevCommand({ cwd: '/tmp', port: 8000, hotReload: true }).command).toBe('python3');
    expect(adapter.getTestCommand('/tmp').args).toContain('pytest');
    expect(adapter.getMigrateCommand().command).toBe('alembic');
  });

  it('returns Express dev and test commands', () => {
    const adapter = getRuntimeAdapter('express');
    const dev = adapter.getDevCommand({ cwd: '/tmp', port: 3000, hotReload: true });
    expect(dev.command).toBe('npx');
    expect(dev.args).toContain('tsx');
    expect(adapter.getTestCommand('/tmp').args).toContain('vitest');
    expect(adapter.getMigrateCommand().args).toContain('prisma');
  });

  it('uses adapter-specific defaults', () => {
    expect(getRuntimeAdapter('fastapi').defaultPort).toBe(8000);
    expect(getRuntimeAdapter('express').defaultPort).toBe(3000);
    expect(getRuntimeAdapter('express').customPath).toBe('src/custom');
  });
});
