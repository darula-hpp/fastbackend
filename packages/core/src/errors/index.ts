/**
 * Custom error classes for FastBackend.
 */

import type { IR } from '../ir/types.js';

export interface ValidationErrorDetail {
  path: string;
  message: string;
  expected?: unknown;
  actual?: unknown;
}

export class SchemaParseError extends Error {
  constructor(
    public schemaPath: string,
    public parserName: string,
    public details: string,
    public line?: number,
    public column?: number,
  ) {
    super(`Schema parsing failed in ${parserName} at ${schemaPath}: ${details}`);
    this.name = 'SchemaParseError';
  }
}

export class IRValidationError extends Error {
  constructor(
    public validationErrors: ValidationErrorDetail[],
    public ir: Partial<IR>,
  ) {
    super(`IR validation failed: ${validationErrors.length} error(s)`);
    this.name = 'IRValidationError';
  }
}

export class ConfigValidationError extends Error {
  constructor(
    public configPath: string,
    public field: string,
    public reason: string,
  ) {
    super(`Invalid configuration at ${field}: ${reason}`);
    this.name = 'ConfigValidationError';
  }
}

export class CodeGenerationError extends Error {
  constructor(
    public component: string,
    public details: string,
    public cause?: Error,
  ) {
    super(`Code generation failed in ${component}: ${details}`);
    this.name = 'CodeGenerationError';
  }
}

export class SubprocessError extends Error {
  constructor(
    public command: string,
    public exitCode: number,
    public stderr: string,
    public stdout: string,
  ) {
    super(`Subprocess "${command}" failed with exit code ${exitCode}`);
    this.name = 'SubprocessError';
  }
}

export class RuntimeInitializationError extends Error {
  constructor(
    public adapter: string,
    public entity: string,
    public details: string,
    public cause?: Error,
  ) {
    super(`Runtime initialization failed for ${entity} (${adapter}): ${details}`);
    this.name = 'RuntimeInitializationError';
  }
}
