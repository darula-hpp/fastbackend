import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { logger } from '../utils/logger.js';

export interface DockerBuildOptions {
  tag?: string;
  file?: string;
}

export async function dockerBuildCommand(options: DockerBuildOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const dockerfile = options.file ?? 'Dockerfile';
  const tag = options.tag ?? 'fastbackend-app:latest';

  if (!existsSync(resolve(cwd, dockerfile))) {
    logger.error(`Dockerfile not found at ${dockerfile}`);
    logger.info('Run `fastbackend init --docker` to generate Docker templates');
    process.exit(1);
  }

  logger.info(`Building Docker image: ${tag}`);

  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn('docker', ['build', '-f', dockerfile, '-t', tag, '.'], {
      cwd,
      stdio: 'inherit',
    });

    child.on('error', (err) => {
      logger.error(`Docker build failed: ${err.message}`);
      logger.info('Make sure Docker is installed and running');
      reject(err);
    });

    child.on('close', (code) => {
      if (code === 0) {
        logger.success(`Docker image built: ${tag}`);
        resolvePromise();
      } else {
        reject(new Error(`Docker build exited with code ${code}`));
      }
    });
  });
}
