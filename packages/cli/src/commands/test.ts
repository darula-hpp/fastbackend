import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ConfigLoader } from '@fastbackend/core';
import { logger } from '../utils/logger.js';
import { getProjectPaths } from '../utils/file-ops.js';

export interface TestOptions {
  adapter?: string;
}

export async function testCommand(options: TestOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const paths = getProjectPaths(cwd);

  let adapter = options.adapter;

  if (!adapter && existsSync(paths.config)) {
    const loader = new ConfigLoader();
    const config = await loader.load(paths.config);
    adapter = config.adapter.name;
  }

  adapter ??= 'fastapi';

  logger.info(`Running ${adapter} tests...`);

  switch (adapter) {
    case 'fastapi':
      await runPytest(cwd);
      break;
    default:
      logger.error(`No test runner configured for adapter: ${adapter}`);
      process.exit(1);
  }
}

function runPytest(cwd: string): Promise<void> {
  const testsDir = resolve(cwd, 'tests');
  const hasTests = existsSync(testsDir);

  const args = hasTests
    ? ['-m', 'pytest', 'tests/', '-v']
    : ['-m', 'pytest', '--co', '-q'];

  return new Promise((resolvePromise, reject) => {
    const child = spawn('python3', args, { cwd, stdio: 'inherit' });

    child.on('error', () => {
      logger.warn('pytest not found. Install with: pip install pytest');
      reject(new Error('pytest not available'));
    });

    child.on('close', (code) => {
      if (code === 0) {
        logger.success('Tests passed');
        resolvePromise();
      } else if (!hasTests) {
        logger.warn('No tests/ directory found. Create tests/ with pytest files.');
        resolvePromise();
      } else {
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });
  });
}
