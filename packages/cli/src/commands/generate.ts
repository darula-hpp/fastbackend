import { resolve } from 'node:path';
import {
  ConfigLoader,
  IRGenerator,
  OpenAPIGenerator,
  CustomEndpointScanner,
  pluginRegistry,
} from '@fastbackend/core';
import { logger } from '../utils/logger.js';
import { getProjectPaths } from '../utils/file-ops.js';

export async function generateCommand(configPath?: string): Promise<void> {
  const cwd = process.cwd();
  const paths = getProjectPaths(cwd);
  const configFile = configPath ?? paths.config;

  logger.info('Loading configuration...');
  const loader = new ConfigLoader();
  const config = await loader.load(configFile);

  logger.info(`Parsing ${config.schema.format} schema...`);
  const parser = pluginRegistry.getOrThrow(config.schema.format);
  const schemaPath = resolve(cwd, config.schema.path);

  const validation = await parser.validate(schemaPath);
  if (!validation.valid) {
    logger.error(`Schema validation failed: ${validation.errors.join(', ')}`);
    process.exit(1);
  }

  const parsedSchema = await parser.parse(schemaPath, {
    include: config.schema.include,
    exclude: config.schema.exclude,
  });

  logger.info('Generating IR...');
  const irGenerator = new IRGenerator();
  const ir = await irGenerator.generate(parsedSchema, {
    projectName: config.project.name,
    schemaFormat: config.schema.format,
    adapter: config.adapter.name,
  });

  await irGenerator.write(ir, resolve(cwd, paths.ir));
  logger.success(`IR written to .fastbackend/ir.json (${ir.entities.length} entities)`);

  logger.info('Generating OpenAPI specification...');
  const openapiGenerator = new OpenAPIGenerator();
  let spec = await openapiGenerator.generate(ir, config.openapi);

  const customPath = resolve(cwd, config.adapter.customPath ?? 'app/custom');
  const scanner = new CustomEndpointScanner(config.adapter.name as 'fastapi' | 'express' | 'spring');
  spec = scanner.mergeCustomEndpoints(spec, customPath);

  const openapiPath = resolve(cwd, config.openapi.outputPath);
  await openapiGenerator.write(spec, openapiPath);

  const pathCount = Object.keys(spec.paths).length;
  logger.success(`OpenAPI written to ${config.openapi.outputPath} (${pathCount} paths)`);

  logger.info('');
  logger.info('Generation summary:');
  logger.info(`  Entities: ${ir.entities.length}`);
  logger.info(`  Relationships: ${ir.relationships.length}`);
  logger.info(`  Enums: ${ir.enums.length}`);
  logger.info(`  OpenAPI paths: ${pathCount}`);
}
