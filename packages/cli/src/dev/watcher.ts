import type { FSWatcher } from 'node:fs';
import { watch } from 'node:fs';

export type WatchCallback = (changedPath: string) => void;

export class DevWatcher {
  private watchers: FSWatcher[] = [];

  watch(paths: string[], onChange: WatchCallback): void {
    this.stop();

    for (const path of paths) {
      const watcher = watch(path, () => {
        onChange(path);
      });
      this.watchers.push(watcher);
    }
  }

  stop(): void {
    for (const watcher of this.watchers) {
      watcher.close();
    }
    this.watchers = [];
  }
}
