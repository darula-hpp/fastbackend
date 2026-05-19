import type { RuntimeAdapterDefinition, SchemaFormat } from './types.js';

const FASTAPI_ADAPTER: RuntimeAdapterDefinition = {
  name: 'fastapi',
  language: 'python',
  supportedSchemaFormats: ['sqlalchemy', 'prisma'],
  defaultPort: 8000,
  customPath: 'app/custom',
  getDevCommand: ({ port, hotReload }) => ({
    command: 'python3',
    args: hotReload
      ? ['-m', 'uvicorn', 'main:app', '--reload', '--port', String(port)]
      : ['-m', 'uvicorn', 'main:app', '--port', String(port)],
  }),
  getTestCommand: () => ({
    command: 'python3',
    args: ['-m', 'pytest', 'tests/', '-v'],
  }),
  getMigrateCommand: () => ({
    command: 'alembic',
    args: ['upgrade', 'head'],
  }),
};

const EXPRESS_ADAPTER: RuntimeAdapterDefinition = {
  name: 'express',
  language: 'typescript',
  supportedSchemaFormats: ['prisma'],
  defaultPort: 3000,
  customPath: 'src/custom',
  getDevCommand: ({ port, hotReload }) => ({
    command: 'npx',
    args: hotReload
      ? ['tsx', 'watch', 'src/main.ts', '--port', String(port)]
      : ['tsx', 'src/main.ts', '--port', String(port)],
  }),
  getTestCommand: () => ({
    command: 'npx',
    args: ['vitest', 'run'],
  }),
  getMigrateCommand: () => ({
    command: 'npx',
    args: ['prisma', 'migrate', 'deploy'],
  }),
};

const SPRING_ADAPTER: RuntimeAdapterDefinition = {
  name: 'spring',
  language: 'java',
  supportedSchemaFormats: ['jpa'],
  defaultPort: 8080,
  customPath: 'src/main/java/custom',
  getDevCommand: ({ port }) => ({
    command: './mvnw',
    args: ['spring-boot:run', `-Dserver.port=${port}`],
  }),
  getTestCommand: () => ({
    command: './mvnw',
    args: ['test'],
  }),
  getMigrateCommand: () => ({
    command: './mvnw',
    args: ['flyway:migrate'],
  }),
};

const ADAPTERS: Record<string, RuntimeAdapterDefinition> = {
  fastapi: FASTAPI_ADAPTER,
  express: EXPRESS_ADAPTER,
  spring: SPRING_ADAPTER,
};

export function getRuntimeAdapter(name: string): RuntimeAdapterDefinition {
  const adapter = ADAPTERS[name];
  if (!adapter) {
    throw new Error(`Unknown runtime adapter: ${name}`);
  }
  return adapter;
}

export function listRuntimeAdapters(): RuntimeAdapterDefinition[] {
  return Object.values(ADAPTERS);
}

export function validateAdapterSchemaPair(adapterName: string, schemaFormat: string): void {
  const adapter = getRuntimeAdapter(adapterName);
  if (!adapter.supportedSchemaFormats.includes(schemaFormat as SchemaFormat)) {
    throw new Error(
      `Adapter "${adapterName}" does not support schema format "${schemaFormat}". ` +
        `Supported formats: ${adapter.supportedSchemaFormats.join(', ')}`,
    );
  }
}
