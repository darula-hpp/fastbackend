import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { watch, type FSWatcher } from 'node:fs';
import { DevWatcher } from '../watcher.js';

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    watch: vi.fn(),
  };
});

describe('DevWatcher', () => {
  let watcher: DevWatcher;
  const mockedWatch = vi.mocked(watch);

  beforeEach(() => {
    watcher = new DevWatcher();
    mockedWatch.mockReset();
  });

  afterEach(() => {
    watcher.stop();
  });

  it('registers fs.watch for each path and forwards change events', () => {
    const handlers: Array<() => void> = [];

    mockedWatch.mockImplementation((_path, listener) => {
      if (typeof listener === 'function') {
        handlers.push(listener as () => void);
      }
      return { close: vi.fn() } as unknown as FSWatcher;
    });

    const onChange = vi.fn();
    watcher.watch(['/tmp/models.py', '/tmp/fastbackend.yaml'], onChange);

    expect(mockedWatch).toHaveBeenCalledTimes(2);
    handlers[0]();
    expect(onChange).toHaveBeenCalledWith('/tmp/models.py');
  });

  it('closes all watchers on stop', () => {
    const close = vi.fn();
    mockedWatch.mockReturnValue({ close } as unknown as FSWatcher);

    watcher.watch(['/tmp/models.py'], vi.fn());
    watcher.stop();

    expect(close).toHaveBeenCalledTimes(1);
  });
});
