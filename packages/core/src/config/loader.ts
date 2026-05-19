import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { load as parseYaml } from 'js-yaml';
import type { FastBackendConfig } from './types.js';
import { ConfigValidationError } from '../errors/index.js';

const ENV_VAR_PATTERN = /\$\{([A-Z_][A-Z0-9_]*)\}/g;

export class ConfigLoader {
  /**
   * Load configuration from fastbackend.yaml.
   */
  async load(configPath: string): Promise<FastBackendConfig> {
    const fullPath = resolve(configPath);

    if (!existsSync(fullPath)) {
      throw new ConfigValidationError(fullPath, 'configPath', 'Configuration file not found');
    }

    const content = readFileSync(fullPath, 'utf-8');
    let parsed: unknown;

    try {
      parsed = parseYaml(content);
    } catch (error) {
      throw new ConfigValidationError(
        fullPath,
        'yaml',
        `Failed to parse YAML: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new ConfigValidationError(fullPath, 'root', 'Configuration must be a YAML object');
    }

    const resolved = this.resolveEnvVars(parsed as Record<string, unknown>) as unknown as FastBackendConfig;
    this.validate(resolved, fullPath);

    return resolved;
  }

  /**
   * Load environment-specific config overlay.
   */
  async loadWithEnvironment(
    configPath: string,
    environment?: string,
  ): Promise<FastBackendConfig> {
    const baseConfig = await this.load(configPath);

    if (!environment) {
      return baseConfig;
    }

    const dir = dirname(resolve(configPath));
    const envPath = resolve(dir, `fastbackend.${environment}.yaml`);

    if (!existsSync(envPath)) {
      return baseConfig;
    }

    const envContent = readFileSync(envPath, 'utf-8');
    const envParsed = parseYaml(envContent) as Record<string, unknown>;
    const resolvedEnv = this.resolveEnvVars(envParsed);
    return this.mergeConfig(baseConfig, resolvedEnv as Partial<FastBackendConfig>);
  }

  /**
   * Replace ${VAR_NAME} placeholders with environment variable values.
   */
  resolveEnvVars<T>(config: T): T {
    return this.resolveValue(config) as T;
  }

  private resolveValue(value: unknown): unknown {
    if (typeof value === 'string') {
      return value.replace(ENV_VAR_PATTERN, (_, varName: string) => {
        const envValue = process.env[varName];
        if (envValue === undefined) {
          throw new ConfigValidationError(
            'environment',
            varName,
            `Environment variable ${varName} is not defined`,
          );
        }
        return envValue;
      });
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.resolveValue(item));
    }

    if (value !== null && typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = this.resolveValue(val);
      }
      return result;
    }

    return value;
  }

  private validate(config: FastBackendConfig, configPath: string): void {
    if (!config.project?.name) {
      throw new ConfigValidationError(configPath, 'project.name', 'Project name is required');
    }
    if (!config.project?.version) {
      throw new ConfigValidationError(configPath, 'project.version', 'Project version is required');
    }
    if (!config.schema?.format) {
      throw new ConfigValidationError(configPath, 'schema.format', 'Schema format is required');
    }
    if (!config.schema?.path) {
      throw new ConfigValidationError(configPath, 'schema.path', 'Schema path is required');
    }
    if (!config.adapter?.name) {
      throw new ConfigValidationError(configPath, 'adapter.name', 'Adapter name is required');
    }
    if (!config.openapi?.outputPath) {
      throw new ConfigValidationError(
        configPath,
        'openapi.outputPath',
        'OpenAPI output path is required',
      );
    }
  }

  private mergeConfig(
    base: FastBackendConfig,
    overlay: Partial<FastBackendConfig>,
  ): FastBackendConfig {
    return {
      project: { ...base.project, ...overlay.project },
      schema: { ...base.schema, ...overlay.schema },
      adapter: { ...base.adapter, ...overlay.adapter },
      openapi: { ...base.openapi, ...overlay.openapi },
      development: overlay.development ?? base.development,
    };
  }
}
