import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { IRGenerator } from '../generator.js';
import { IRValidationError } from '../../errors/index.js';
import type { ParsedSchema } from '../types.js';

describe('IRGenerator edge cases', () => {
  let tempDir: string;
  const generator = new IRGenerator();

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'fb-ir-edge-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should write invalid IR to ir.invalid.json on validation failure', async () => {
    const invalidIr = { version: 'not-valid-semver' };

    const outputPath = join(tempDir, '.fastbackend', 'ir.json');
    await expect(generator.write(invalidIr as never, outputPath)).rejects.toThrow(IRValidationError);

    const invalidPath = join(tempDir, '.fastbackend', 'ir.invalid.json');
    expect(existsSync(invalidPath)).toBe(true);
  });

  it('should map array and enum field types', async () => {
    const schema: ParsedSchema = {
      entities: [{
        name: 'Tag',
        tableName: 'tags',
        fields: [
          { name: 'id', type: 'integer', nullable: false, metadata: {} },
          { name: 'labels', type: 'array<string>', nullable: true, metadata: {} },
          { name: 'status', type: 'enum:Status', nullable: false, metadata: {} },
        ],
        constraints: [{ type: 'primary_key', fields: ['id'] }],
        metadata: {},
      }],
      relationships: [],
      metadata: { schemaFormat: 'sqlalchemy', schemaVersion: '1.0.0' },
    };

    const ir = await generator.generate(schema, {
      projectName: 'test',
      schemaFormat: 'sqlalchemy',
      adapter: 'fastapi',
    });

    const tag = ir.entities[0];
    expect(tag.fields.find((f) => f.name === 'labels')?.type.base).toBe('array');
    expect(tag.fields.find((f) => f.name === 'status')?.type.enumRef).toBe('Status');
  });

  it('should throw for unknown field types', async () => {
    const schema: ParsedSchema = {
      entities: [{
        name: 'Widget',
        tableName: 'widgets',
        fields: [{ name: 'blob', type: 'unknown_type', nullable: true, metadata: {} }],
        constraints: [{ type: 'primary_key', fields: ['blob'] }],
        metadata: {},
      }],
      relationships: [],
      metadata: { schemaFormat: 'sqlalchemy', schemaVersion: '1.0.0' },
    };

    await expect(generator.generate(schema, {
      projectName: 'test',
      schemaFormat: 'sqlalchemy',
      adapter: 'fastapi',
    })).rejects.toThrow('Unknown field type');
  });

  it('should throw when entity has no primary key', async () => {
    const schema: ParsedSchema = {
      entities: [{
        name: 'Widget',
        tableName: 'widgets',
        fields: [{ name: 'name', type: 'string', nullable: false, metadata: {} }],
        constraints: [],
        metadata: {},
      }],
      relationships: [],
      metadata: { schemaFormat: 'sqlalchemy', schemaVersion: '1.0.0' },
    };

    await expect(generator.generate(schema, {
      projectName: 'test',
      schemaFormat: 'sqlalchemy',
      adapter: 'fastapi',
    })).rejects.toThrow('primary key');
  });
});
