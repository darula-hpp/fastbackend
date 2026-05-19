import { generateCommand } from './generate.js';
import { logger } from '../utils/logger.js';

export async function buildCommand(): Promise<void> {
  logger.info('Building production IR and OpenAPI...');
  await generateCommand();
  logger.success('Production build complete');
}
