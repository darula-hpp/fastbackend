import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { ConfigLoader, getRuntimeAdapter } from '@fastbackend/core';
import { logger } from '../utils/logger.js';
import { getProjectPaths } from '../utils/file-ops.js';
import { loadProjectEnv } from '../utils/load-project-env.js';

export async function migrateCommand(): Promise<void> {
  const cwd = process.cwd();
  const paths = getProjectPaths(cwd);

  let adapterName = 'fastapi';
  if (existsSync(paths.config)) {
    const loader = new ConfigLoader();
    const config = await loader.load(paths.config);
    adapterName = config.adapter.name;
  }

  const adapter = getRuntimeAdapter(adapterName);
  logger.info(`Running database migrations for ${adapter.name}...`);

  const { command, args } = adapter.getMigrateCommand();

  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    env: loadProjectEnv(cwd),
  });

  child.on('error', () => {
    logger.warn(`Migration tool not configured for adapter "${adapter.name}".`);
    process.exit(1);
  });

  child.on('close', (code) => {
    if (code === 0) {
      logger.success('Migrations complete');
    }
    process.exit(code ?? 0);
  });
}
