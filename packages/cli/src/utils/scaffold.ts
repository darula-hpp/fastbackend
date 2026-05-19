import { join } from 'node:path';
import { getRuntimeAdapter, validateAdapterSchemaPair } from '@fastbackend/core';
import { writeFile, getProjectPaths } from './file-ops.js';
import { scaffoldFastApiProject } from './scaffolds/fastapi.js';
import { scaffoldExpressProject } from './scaffolds/express.js';

export interface ScaffoldOptions {
  name: string;
  schema: string;
  adapter: string;
  docker?: boolean;
}

export function scaffoldProject(cwd: string, options: ScaffoldOptions): string[] {
  validateAdapterSchemaPair(options.adapter, options.schema);
  const adapter = getRuntimeAdapter(options.adapter);

  const vars = {
    name: options.name,
    schema: options.schema,
    schemaPath: getSchemaPath(options.schema),
    adapter: options.adapter,
    port: String(adapter.defaultPort),
    customPath: adapter.customPath,
  };

  writeFile(getProjectPaths(cwd).config, render(FASTBACKEND_YAML, vars));

  switch (options.adapter) {
    case 'express':
      return ['fastbackend.yaml', ...scaffoldExpressProject(cwd, vars, options.docker)];
    case 'fastapi':
    default:
      return ['fastbackend.yaml', ...scaffoldFastApiProject(cwd, vars, options.docker)];
  }
}

const FASTBACKEND_YAML = `project:
  name: {{name}}
  version: 1.0.0
  description: FastBackend API project

schema:
  format: {{schema}}
  path: {{schemaPath}}

adapter:
  name: {{adapter}}
  customPath: {{customPath}}

openapi:
  outputPath: .fastbackend/openapi.yaml
  title: {{name}}
  version: 1.0.0
  servers:
    - url: http://localhost:{{port}}
      description: Development server
  annotations:
    relationships: true

development:
  watch: true
  port: {{port}}
  hotReload: true
`;

function render(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

function getSchemaPath(format: string): string {
  switch (format) {
    case 'prisma':
      return 'schema.prisma';
    case 'sqlalchemy':
      return 'models.py';
    default:
      throw new Error(`Unsupported schema format: ${format}`);
  }
}
