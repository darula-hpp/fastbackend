import { spawn } from 'node:child_process';
import { logger } from '../utils/logger.js';

export async function migrateCommand(): Promise<void> {
  logger.info('Running database migrations via Alembic...');

  const child = spawn('alembic', ['upgrade', 'head'], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });

  child.on('error', () => {
    logger.warn('Alembic not configured. Set up Alembic migrations in your project.');
    process.exit(1);
  });

  child.on('close', (code) => {
    if (code === 0) {
      logger.success('Migrations complete');
    }
    process.exit(code ?? 0);
  });
}
