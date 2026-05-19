import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { IRGenerator } from '../generator.js';
import type { ParsedSchema } from '../types.js';

describe('IRGenerator', () => {
  let tempDir: string;
  const generator = new IRGenerator();

  const mockParsedSchema: ParsedSchema = {
    entities: [
      {
        name: 'User',
        tableName: 'users',
        fields: [
          {
            name: 'id',
            type: 'integer',
            nullable: false,
            metadata: {},
          },
          {
            name: 'email',
            type: 'string',
            nullable: false,
            validation: [{ type: 'required' }, { type: 'email' }],
            metadata: { description: 'Email address' },
          },
        ],
        constraints: [{ type: 'primary_key', fields: ['id'] }],
        metadata: {},
      },
      {
        name: 'Post',
        tableName: 'posts',
        fields: [
          { name: 'id', type: 'integer', nullable: false, metadata: {} },
          { name: 'title', type: 'string', nullable: false, metadata: {} },
          { name: 'user_id', type: 'integer', nullable: false, metadata: {} },
        ],
        constraints: [{ type: 'primary_key', fields: ['id'] }],
        metadata: {},
      },
    ],
    relationships: [
      {
        name: 'posts',
        type: 'one-to-many',
        sourceEntity: 'User',
        targetEntity: 'Post',
        sourceField: 'id',
        targetField: 'user_id',
        cascadeDelete: false,
        metadata: { backPopulates: 'author' },
      },
    ],
    metadata: { schemaFormat: 'sqlalchemy', schemaVersion: '1.0.0' },
  };

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'fastbackend-ir-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should convert parsed schema to IR', async () => {
    const ir = await generator.generate(mockParsedSchema, {
      projectName: 'test-api',
      schemaFormat: 'sqlalchemy',
      adapter: 'fastapi',
    });

    expect(ir.version).toBe('1.0.0');
    expect(ir.entities).toHaveLength(2);
    expect(ir.relationships).toHaveLength(1);
    expect(ir.metadata.projectName).toBe('test-api');
  });

  it('should validate IR against JSON schema', async () => {
    const ir = await generator.generate(mockParsedSchema, {
      projectName: 'test-api',
      schemaFormat: 'sqlalchemy',
      adapter: 'fastapi',
    });

    const result = generator.validate(ir);
    expect(result.valid).toBe(true);
  });

  it('should write IR to file', async () => {
    const ir = await generator.generate(mockParsedSchema, {
      projectName: 'test-api',
      schemaFormat: 'sqlalchemy',
      adapter: 'fastapi',
    });

    const outputPath = join(tempDir, '.fastbackend', 'ir.json');
    await generator.write(ir, outputPath);

    expect(existsSync(outputPath)).toBe(true);
    const written = JSON.parse(readFileSync(outputPath, 'utf-8'));
    expect(written.entities).toHaveLength(2);
  });

  it('should map field types correctly', async () => {
    const ir = await generator.generate(mockParsedSchema, {
      projectName: 'test-api',
      schemaFormat: 'sqlalchemy',
      adapter: 'fastapi',
    });

    const user = ir.entities.find((e) => e.name === 'User');
    expect(user?.fields.find((f) => f.name === 'email')?.type.base).toBe('string');
    expect(user?.fields.find((f) => f.name === 'id')?.type.base).toBe('integer');
  });
});
