import { describe, it, expect } from 'vitest';
import { bootstrapParsers } from '../bootstrap.js';
import { pluginRegistry } from '../plugin-interface.js';
import { resolveColocatedAsset } from '../../assets/locator.js';

describe('bootstrapParsers', () => {
  it('registers built-in parser plugins idempotently', () => {
    bootstrapParsers();
    bootstrapParsers();

    expect(pluginRegistry.get('sqlalchemy')).toBeDefined();
    expect(pluginRegistry.get('prisma')).toBeDefined();
  });
});

describe('resolveColocatedAsset', () => {
  it('resolves assets colocated with the module', () => {
    const schemaPath = resolveColocatedAsset(
      new URL('../../ir/validator.ts', import.meta.url).href,
      'schema.json',
    );
    expect(schemaPath.endsWith('schema.json')).toBe(true);
  });

  it('throws when asset is missing', () => {
    expect(() =>
      resolveColocatedAsset(import.meta.url, 'missing-file.json'),
    ).toThrow('Colocated asset not found');
  });
});
