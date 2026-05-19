import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { scaffoldProject } from '../utils/scaffold.js';
import { logger } from '../utils/logger.js';
import { fileExists } from '../utils/file-ops.js';

export interface InitOptions {
  schema: string;
  adapter: string;
  docker?: boolean;
}

export async function initCommand(name: string, options: InitOptions): Promise<void> {
  const cwd = resolve(process.cwd(), name);

  if (fileExists(cwd)) {
    logger.error(`Directory "${name}" already exists`);
    process.exit(1);
  }

  mkdirSync(cwd, { recursive: true });

  logger.info(`Initializing FastBackend project: ${name}`);

  const created = scaffoldProject(cwd, {
    name,
    schema: options.schema,
    adapter: options.adapter,
    docker: options.docker,
  });

  logger.success(`Created project "${name}"`);
  for (const file of created) {
    logger.info(`  ${file}`);
  }

  logger.info('');
  logger.info('Next steps:');
  logger.info(`  cd ${name}`);
  logger.info('  pip install -r requirements.txt');
  logger.info('  fastbackend generate');
  logger.info('  fastbackend dev');
}
