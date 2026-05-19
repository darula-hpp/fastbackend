import { describe, it, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePrismaSchema } from '../parser.js';
import { PrismaPlugin } from '../plugin.js';
import { IRGenerator } from '../../../ir/generator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, 'fixtures', 'schema.prisma');

describe('Prisma parser', () => {
  it('should extract entities from Prisma schema', () => {
    const parsed = parsePrismaSchema(schemaPath);
    expect(parsed.entities).toHaveLength(2);
    expect(parsed.entities.some((e) => e.name === 'User')).toBe(true);
    expect(parsed.entities.some((e) => e.name === 'Post')).toBe(true);
  });

  it('should extract fields with correct types', () => {
    const parsed = parsePrismaSchema(schemaPath);
    const user = parsed.entities.find((e) => e.name === 'User');
    expect(user?.fields.some((f) => f.name === 'email' && f.type === 'string')).toBe(true);
    expect(user?.fields.some((f) => f.name === 'role' && f.type === 'enum:Role')).toBe(true);
  });

  it('should extract enums', () => {
    const parsed = parsePrismaSchema(schemaPath);
    expect(parsed.enums).toHaveLength(1);
    expect(parsed.enums![0].name).toBe('Role');
    expect(parsed.enums![0].values).toHaveLength(2);
  });

  it('should treat optional scalar fields as fields, not relationships', () => {
    const parsed = parsePrismaSchema(schemaPath);
    const post = parsed.entities.find((entity) => entity.name === 'Post');

    expect(post?.fields.some((field) => field.name === 'content' && field.type === 'string')).toBe(true);
    expect(parsed.relationships.some((relationship) => relationship.targetEntity === 'String?')).toBe(false);
    expect(parsed.relationships.some((relationship) => relationship.name === 'content')).toBe(false);
  });

  it('should not duplicate foreign key fields already declared on the model', () => {
    const parsed = parsePrismaSchema(schemaPath);
    const post = parsed.entities.find((entity) => entity.name === 'Post');
    const authorIdFields = post?.fields.filter((field) => field.name === 'authorId') ?? [];

    expect(authorIdFields).toHaveLength(1);
  });

  it('should generate valid IR via plugin', async () => {
    const plugin = new PrismaPlugin();
    const parsed = await plugin.parse(schemaPath, {});
    const generator = new IRGenerator();
    const ir = await generator.generate(parsed, {
      projectName: 'prisma-test',
      schemaFormat: 'prisma',
      adapter: 'fastapi',
    });

    expect(generator.validate(ir).valid).toBe(true);
    expect(ir.entities).toHaveLength(2);
    expect(ir.enums).toHaveLength(1);
  });
});
