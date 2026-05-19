import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ConfigLoader, getRuntimeAdapter } from '@fastbackend/core';
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

  try {
    const runtimeAdapter = getRuntimeAdapter(adapter);
    const { command, args } = runtimeAdapter.getTestCommand(cwd);
    const hasTests = existsSync(resolve(cwd, adapter === 'fastapi' ? 'tests' : 'tests'));

    await runProcess(command, args, cwd, hasTests);
    logger.success('Tests passed');
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

function runProcess(command: string, args: string[], cwd: string, hasTests: boolean): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit' });

    child.on('error', () => {
      reject(new Error(`${command} not available for this adapter`));
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise();
      } else if (!hasTests) {
        logger.warn('No tests/ directory found. Create tests/ with adapter-specific test files.');
        resolvePromise();
      } else {
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });
  });
}
