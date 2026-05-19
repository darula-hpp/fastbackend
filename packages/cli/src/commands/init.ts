import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { getRuntimeAdapter, validateAdapterSchemaPair } from '@fastbackend/core';
import { scaffoldProject } from '../utils/scaffold.js';
import { logger } from '../utils/logger.js';
import { fileExists } from '../utils/file-ops.js';

export interface InitOptions {
  schema: string;
  adapter: string;
  docker?: boolean;
}

export async function initCommand(name: string, options: InitOptions): Promise<void> {
  validateAdapterSchemaPair(options.adapter, options.schema);

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

  const adapter = getRuntimeAdapter(options.adapter);

  logger.info('');
  logger.info('Next steps:');
  logger.info(`  cd ${name}`);

  switch (adapter.language) {
    case 'typescript':
      logger.info('  npm install');
      logger.info('  cp .env.example .env');
      logger.info('  npx prisma migrate dev');
      break;
    case 'python':
      logger.info('  pip install -r requirements.txt');
      break;
    default:
      break;
  }

  logger.info('  fastbackend generate');
  logger.info('  fastbackend dev');
}
