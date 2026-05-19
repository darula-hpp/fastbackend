import { describe, it, expect, beforeAll } from 'vitest';
import { pluginRegistry } from '../plugin-interface.js';
import { bootstrapParsers } from '../bootstrap.js';

describe('PluginRegistry', () => {
  beforeAll(() => {
    bootstrapParsers();
  });
  it('should register and retrieve plugins by format', () => {
    expect(pluginRegistry.get('sqlalchemy')).toBeDefined();
    expect(pluginRegistry.get('prisma')).toBeDefined();
  });

  it('should list registered formats', () => {
    const formats = pluginRegistry.listFormats();
    expect(formats).toContain('sqlalchemy');
    expect(formats).toContain('prisma');
  });

  it('should throw for unknown format', () => {
    expect(() => pluginRegistry.getOrThrow('unknown')).toThrow('No schema parser registered');
  });

  it('should return undefined for unregistered format', () => {
    expect(pluginRegistry.get('jpa')).toBeUndefined();
  });

  it('should register plugin formats', () => {
    expect(pluginRegistry.get('sqlalchemy')?.name).toBe('sqlalchemy');
    expect(pluginRegistry.get('prisma')?.name).toBe('prisma');
  });
});
