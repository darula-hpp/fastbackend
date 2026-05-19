/**
 * Runtime adapter metadata shared between core and CLI.
 */

export type RuntimeAdapterName = 'fastapi' | 'express' | 'spring';
export type RuntimeLanguage = 'python' | 'typescript' | 'java';
export type SchemaFormat = 'sqlalchemy' | 'prisma' | 'jpa';

export interface DevServerOptions {
  cwd: string;
  port: number;
  hotReload: boolean;
}

export interface ProcessCommand {
  command: string;
  args: string[];
}

export interface RuntimeAdapterDefinition {
  name: RuntimeAdapterName;
  language: RuntimeLanguage;
  supportedSchemaFormats: SchemaFormat[];
  defaultPort: number;
  customPath: string;
  getDevCommand: (options: DevServerOptions) => ProcessCommand;
  getTestCommand: (cwd: string) => ProcessCommand;
  getMigrateCommand: () => ProcessCommand;
}
