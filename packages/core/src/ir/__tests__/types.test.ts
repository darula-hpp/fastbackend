import { describe, it, expect } from 'vitest';
import { IR_VERSION, type IR } from '../types.js';
import { IRValidator } from '../validator.js';

describe('IR types', () => {
  const validIR: IR = {
    version: IR_VERSION,
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
            validation: [{ type: 'required' }, { type: 'email' }],
            metadata: { description: 'User email address' },
          },
        ],
        primaryKey: ['id'],
        uniqueConstraints: [['email']],
        indexes: [],
        metadata: { tags: ['Users'] },
      },
    ],
    relationships: [],
    enums: [],
  };

  it('should validate a correct IR structure', () => {
    const validator = new IRValidator();
    const result = validator.validate(validIR);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject IR missing required fields', () => {
    const validator = new IRValidator();
    const invalid = { version: IR_VERSION };
    const result = validator.validate(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject IR with invalid version format', () => {
    const validator = new IRValidator();
    const invalid = { ...validIR, version: 'invalid' };
    const result = validator.validate(invalid);
    expect(result.valid).toBe(false);
  });
});
