import { describe, it, expect } from 'vitest';
import { ValidationEngine, ValidationError } from '../validation-engine.js';
import type { IREntity } from '../../utils/ir-loader.js';

const USER_ENTITY: IREntity = {
  name: 'User',
  primaryKey: ['id'],
  fields: [
    { name: 'id', type: { base: 'integer' }, nullable: false, validation: [] },
    {
      name: 'name',
      type: { base: 'string' },
      nullable: false,
      validation: [{ type: 'required' }, { type: 'minLength', value: 2 }],
    },
    {
      name: 'email',
      type: { base: 'string', format: 'email' },
      nullable: false,
      validation: [{ type: 'required' }],
    },
  ],
};

describe('ValidationEngine', () => {
  it('creates create/update schemas and validates payloads', () => {
    const engine = new ValidationEngine();
    engine.createSchemas(USER_ENTITY);

    const created = engine.validatePayload('UserCreate', {
      name: 'Ada',
      email: 'ada@example.com',
    });
    expect(created).toEqual({ name: 'Ada', email: 'ada@example.com' });

    const updated = engine.validatePayload('UserUpdate', { name: 'Grace' }, true);
    expect(updated).toEqual({ name: 'Grace' });
  });

  it('rejects invalid email on create', () => {
    const engine = new ValidationEngine();
    engine.createSchemas(USER_ENTITY);

    expect(() =>
      engine.validatePayload('UserCreate', { name: 'Ada', email: 'not-an-email' }),
    ).toThrow(ValidationError);
  });

  it('rejects non-object bodies when no schema exists', () => {
    const engine = new ValidationEngine();
    expect(() => engine.validatePayload('Missing', 'bad')).toThrow(ValidationError);
  });
});
