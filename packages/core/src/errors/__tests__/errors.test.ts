import { describe, it, expect } from 'vitest';
import {
  SchemaParseError,
  IRValidationError,
  ConfigValidationError,
  CodeGenerationError,
  SubprocessError,
  RuntimeInitializationError,
} from '../index.js';

describe('Error classes', () => {
  it('SchemaParseError includes parser and path context', () => {
    const err = new SchemaParseError('models.py', 'sqlalchemy', 'syntax error', 10, 5);
    expect(err.name).toBe('SchemaParseError');
    expect(err.message).toContain('sqlalchemy');
    expect(err.message).toContain('models.py');
    expect(err.line).toBe(10);
  });

  it('IRValidationError includes validation errors', () => {
    const err = new IRValidationError(
      [{ path: '/entities', message: 'required' }],
      { version: '1.0.0' },
    );
    expect(err.name).toBe('IRValidationError');
    expect(err.validationErrors).toHaveLength(1);
  });

  it('ConfigValidationError includes field path', () => {
    const err = new ConfigValidationError('fastbackend.yaml', 'schema.path', 'required');
    expect(err.field).toBe('schema.path');
  });

  it('CodeGenerationError includes component name', () => {
    const err = new CodeGenerationError('OpenAPIGenerator', 'failed');
    expect(err.component).toBe('OpenAPIGenerator');
  });

  it('SubprocessError includes exit code and stderr', () => {
    const err = new SubprocessError('python parser.py', 1, 'ImportError', '');
    expect(err.exitCode).toBe(1);
    expect(err.stderr).toBe('ImportError');
  });

  it('RuntimeInitializationError includes adapter and entity', () => {
    const err = new RuntimeInitializationError('fastapi', 'User', 'missing field');
    expect(err.adapter).toBe('fastapi');
    expect(err.entity).toBe('User');
  });
});
