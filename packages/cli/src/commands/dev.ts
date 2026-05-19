import { resolve } from 'node:path';
import { ConfigLoader } from '@fastbackend/core';
import { generateCommand } from './generate.js';
import { logger } from '../utils/logger.js';
import { getProjectPaths, fileExists } from '../utils/file-ops.js';
import { DevWatcher } from '../dev/watcher.js';
import { startFastApiServer } from '../dev/server.js';

export interface DevOptions {
  watch?: boolean;
  port?: number;
}

export async function devCommand(options: DevOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const paths = getProjectPaths(cwd);

  if (!fileExists(paths.ir)) {
    logger.info('IR not found, running generate first...');
    await generateCommand();
  }

  const loader = new ConfigLoader();
  const config = await loader.load(paths.config);
  const port = options.port ?? config.development?.port ?? 8000;
  const watchEnabled = options.watch ?? config.development?.watch ?? false;

  const watcher = new DevWatcher();

  if (watchEnabled) {
    logger.info('Watch mode enabled');
    const schemaPath = resolve(cwd, config.schema.path);

    watcher.watch([schemaPath, paths.config], (changedPath) => {
      const label = changedPath === schemaPath ? 'Schema' : 'Config';
      logger.info(`${label} changed, regenerating...`);
      generateCommand().catch((err) => logger.error(String(err)));
    });
  }

  logger.info(`Starting FastAPI runtime on port ${port}...`);

  const hotReload = config.development?.hotReload ?? true;
  await startFastApiServer({ cwd, port, hotReload });
}
