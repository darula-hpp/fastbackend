import { describe, it, expect } from 'vitest';
import { SQLAlchemyPlugin } from '../sqlalchemy/plugin.js';
import { PrismaPlugin } from '../prisma/plugin.js';

describe('SQLAlchemyPlugin errors', () => {
  const plugin = new SQLAlchemyPlugin();

  it('should reject non-Python files', async () => {
    const result = await plugin.validate('/tmp/schema.yaml');
    expect(result.valid).toBe(false);
  });

  it('should reject missing schema file', async () => {
    const result = await plugin.validate('/nonexistent/models.py');
    expect(result.valid).toBe(false);
  });

  it('should throw SchemaParseError for missing file on parse', async () => {
    await expect(plugin.parse('/nonexistent/models.py', {})).rejects.toThrow('Schema file not found');
  });
});

describe('PrismaPlugin errors', () => {
  const plugin = new PrismaPlugin();

  it('should reject non-Prisma files', async () => {
    const result = await plugin.validate('/tmp/schema.py');
    expect(result.valid).toBe(false);
  });

  it('should throw SchemaParseError for missing file on parse', async () => {
    await expect(plugin.parse('/nonexistent/schema.prisma', {})).rejects.toThrow('Schema file not found');
  });
});
