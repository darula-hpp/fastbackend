/**
 * Configuration types for FastBackend.
 */

export interface OpenAPIServer {
  url: string;
  description?: string;
}

export interface AnnotationConfig {
  relationships?: boolean;
  custom?: Record<string, unknown>;
}

export interface FastBackendConfig {
  project: ProjectConfig;
  schema: SchemaConfig;
  adapter: AdapterConfig;
  openapi: OpenAPIConfig;
  development?: DevelopmentConfig;
}

export interface ProjectConfig {
  name: string;
  version: string;
  description?: string;
}

export interface SchemaConfig {
  format: 'sqlalchemy' | 'prisma' | 'jpa';
  path: string;
  include?: string[];
  exclude?: string[];
}

export interface AdapterConfig {
  name: 'fastapi' | 'spring' | 'express';
  customPath?: string;
  options?: Record<string, unknown>;
}

export interface OpenAPIConfig {
  outputPath: string;
  title?: string;
  version?: string;
  servers?: OpenAPIServer[];
  annotations?: AnnotationConfig;
}

export interface DevelopmentConfig {
  watch: boolean;
  port?: number;
  hotReload: boolean;
}

export interface ParserConfig {
  include?: string[];
  exclude?: string[];
}
