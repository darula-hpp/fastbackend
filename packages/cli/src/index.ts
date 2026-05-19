#!/usr/bin/env node

/**
 * @fastbackend/cli
 *
 * Command-line interface for FastBackend framework.
 */

import { Command } from 'commander';
import { createRequire } from 'node:module';
import { initCommand } from './commands/init.js';
import { generateCommand } from './commands/generate.js';
import { devCommand } from './commands/dev.js';
import { buildCommand } from './commands/build.js';
import { migrateCommand } from './commands/migrate.js';
import { dockerBuildCommand } from './commands/docker-build.js';
import { testCommand } from './commands/test.js';
import { logger } from './utils/logger.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

const program = new Command();

program
  .name('fastbackend')
  .description('Schema-driven backend runtime framework')
  .version(version)
  .option('--debug', 'Enable debug logging');

program.hook('preAction', (thisCommand) => {
  const opts = thisCommand.opts();
  if (opts.debug) {
    logger.setDebug(true);
  }
});

program
  .command('init')
  .description('Initialize a new FastBackend project')
  .argument('<name>', 'Project name')
  .option('--schema <format>', 'Schema format', 'sqlalchemy')
  .option('--adapter <adapter>', 'Runtime adapter', 'fastapi')
  .option('--docker', 'Include Docker templates')
  .action(async (name: string, options: { schema: string; adapter: string; docker?: boolean }) => {
    try {
      await initCommand(name, options);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('generate')
  .description('Generate IR and OpenAPI from schema')
  .option('-c, --config <path>', 'Path to fastbackend.yaml')
  .action(async (options: { config?: string }) => {
    try {
      await generateCommand(options.config);
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('dev')
  .description('Start development server with optional watch mode')
  .option('--watch', 'Watch schema and config for changes')
  .option('--port <port>', 'Server port', '8000')
  .action(async (options: { watch?: boolean; port: string }) => {
    try {
      await devCommand({
        watch: options.watch,
        port: parseInt(options.port, 10),
      });
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('build')
  .description('Build production IR and OpenAPI')
  .action(async () => {
    try {
      await buildCommand();
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('migrate')
  .description('Run database migrations')
  .action(async () => {
    try {
      await migrateCommand();
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('docker:build')
  .description('Build Docker image for the project')
  .option('-t, --tag <tag>', 'Docker image tag', 'fastbackend-app:latest')
  .option('-f, --file <path>', 'Path to Dockerfile', 'Dockerfile')
  .action(async (options: { tag: string; file: string }) => {
    try {
      await dockerBuildCommand({ tag: options.tag, file: options.file });
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('test')
  .description('Run framework-specific tests')
  .option('--adapter <adapter>', 'Runtime adapter to test against')
  .action(async (options: { adapter?: string }) => {
    try {
      await testCommand({ adapter: options.adapter });
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();
