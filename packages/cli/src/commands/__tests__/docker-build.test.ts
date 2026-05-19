import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'node:events';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dockerBuildCommand } from '../docker-build.js';

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    existsSync: vi.fn(),
  };
});

describe('dockerBuildCommand', () => {
  const mockedSpawn = vi.mocked(spawn);
  const mockedExistsSync = vi.mocked(existsSync);

  beforeEach(() => {
    mockedSpawn.mockReset();
    mockedExistsSync.mockReset();
    mockedExistsSync.mockReturnValue(true);
  });

  it('builds image with default tag and Dockerfile', async () => {
    const child = new EventEmitter() as EventEmitter & { on: EventEmitter['on'] };
    mockedSpawn.mockReturnValue(child as ReturnType<typeof spawn>);

    const promise = dockerBuildCommand();
    child.emit('close', 0);
    await promise;

    expect(mockedSpawn).toHaveBeenCalledWith(
      'docker',
      ['build', '-f', 'Dockerfile', '-t', 'fastbackend-app:latest', '.'],
      expect.objectContaining({ stdio: 'inherit' }),
    );
  });

  it('uses custom tag and Dockerfile when provided', async () => {
    const child = new EventEmitter() as EventEmitter & { on: EventEmitter['on'] };
    mockedSpawn.mockReturnValue(child as ReturnType<typeof spawn>);

    const promise = dockerBuildCommand({ tag: 'my-app:v1', file: 'Dockerfile.prod' });
    child.emit('close', 0);
    await promise;

    expect(mockedSpawn).toHaveBeenCalledWith(
      'docker',
      ['build', '-f', 'Dockerfile.prod', '-t', 'my-app:v1', '.'],
      expect.any(Object),
    );
  });

  it('rejects when docker build exits with non-zero code', async () => {
    const child = new EventEmitter() as EventEmitter & { on: EventEmitter['on'] };
    mockedSpawn.mockReturnValue(child as ReturnType<typeof spawn>);

    const promise = dockerBuildCommand();
    child.emit('close', 1);

    await expect(promise).rejects.toThrow('Docker build exited with code 1');
  });

  it('exits when Dockerfile is missing', async () => {
    mockedExistsSync.mockReturnValue(false);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit:${code}`);
    });

    await expect(dockerBuildCommand()).rejects.toThrow('process.exit:1');
    expect(mockedSpawn).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });
});
