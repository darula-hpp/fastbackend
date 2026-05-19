import { describe, it, expect } from 'vitest';
import { OpenAPIGenerator } from '../generator.js';
import type { IR } from '../../ir/types.js';

describe('OpenAPIGenerator', () => {
  const generator = new OpenAPIGenerator();

  const mockIR: IR = {
    version: '1.0.0',
    metadata: {
      projectName: 'test-api',
      schemaFormat: 'sqlalchemy',
      adapter: 'fastapi',
      generatedAt: new Date().toISOString(),
      schemaVersion: '1.0.0',
    },
    entities: [
      {
        name: 'User',
        tableName: 'users',
        fields: [
          {
            name: 'id',
            type: { base: 'integer' },
            nullable: false,
            validation: [{ type: 'required' }],
            metadata: {},
          },
          {
            name: 'email',
            type: { base: 'string', format: 'email' },
            nullable: false,
            validation: [{ type: 'required' }],
            metadata: {},
          },
        ],
        primaryKey: ['id'],
        uniqueConstraints: [],
        indexes: [],
        metadata: { tags: ['Users'] },
      },
    ],
    relationships: [
      {
        name: 'posts',
        type: 'one-to-many',
        sourceEntity: 'User',
        targetEntity: 'Post',
        cascadeDelete: false,
        metadata: {},
      },
    ],
    enums: [],
  };

  it('should generate OpenAPI spec from IR', async () => {
    const spec = await generator.generate(mockIR, {
      outputPath: '.fastbackend/openapi.yaml',
    });

    expect(spec.openapi).toBe('3.1.0');
    expect(spec.paths['/users']).toBeDefined();
    expect(spec.components.schemas.User).toBeDefined();
  });

  it('should include CRUD endpoints for each entity', async () => {
    const spec = await generator.generate(mockIR, {
      outputPath: '.fastbackend/openapi.yaml',
    });

    expect(spec.paths['/users'].get).toBeDefined();
    expect(spec.paths['/users'].post).toBeDefined();
    expect(spec.paths['/users/{id}'].get).toBeDefined();
    expect(spec.paths['/users/{id}'].put).toBeDefined();
    expect(spec.paths['/users/{id}'].delete).toBeDefined();
  });

  it('should include relationship endpoints', async () => {
    const spec = await generator.generate(mockIR, {
      outputPath: '.fastbackend/openapi.yaml',
    });

    expect(spec.paths['/users/{id}/posts']).toBeDefined();
    expect(spec.paths['/users/{id}/posts'].get?.['x-uigen-relationship']).toBeDefined();
  });

  it('should include health check endpoint', async () => {
    const spec = await generator.generate(mockIR, {
      outputPath: '.fastbackend/openapi.yaml',
    });

    expect(spec.paths['/health']).toBeDefined();
    expect(spec.paths['/health'].get).toBeDefined();
  });

  it('should include query parameters for list endpoints', async () => {
    const spec = await generator.generate(mockIR, {
      outputPath: '.fastbackend/openapi.yaml',
    });

    const listOp = spec.paths['/users'].get;
    const paramNames = listOp?.parameters?.map((p) => p.name) ?? [];
    expect(paramNames).toContain('limit');
    expect(paramNames).toContain('offset');
    expect(paramNames).toContain('sort');
    expect(paramNames).toContain('q');
  });
});
