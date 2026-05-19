import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SQLAlchemyPlugin } from '../sqlalchemy/plugin.js';
import { IRGenerator } from '../../ir/generator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const FIXTURES = join(__dirname, 'fixtures');

describe('SQLAlchemy parser integration', () => {
  const plugin = new SQLAlchemyPlugin();
  const modelsPath = join(FIXTURES, 'models.py');

  it('should validate SQLAlchemy schema file', async () => {
    if (!existsSync(modelsPath)) return;
    const result = await plugin.validate(modelsPath);
    expect(result.valid).toBe(true);
  });

  it('should parse SQLAlchemy models', async () => {
    if (!existsSync(modelsPath)) return;
    const parsed = await plugin.parse(modelsPath, {});
    expect(parsed.entities.length).toBeGreaterThanOrEqual(2);
    expect(parsed.entities.some((e) => e.name === 'User')).toBe(true);
    expect(parsed.entities.some((e) => e.name === 'Post')).toBe(true);
  });

  it('should extract relationships from SQLAlchemy models', async () => {
    if (!existsSync(modelsPath)) return;
    const parsed = await plugin.parse(modelsPath, {});
    expect(parsed.relationships.length).toBeGreaterThanOrEqual(1);
  });

  it('should generate valid IR from parsed SQLAlchemy schema', async () => {
    if (!existsSync(modelsPath)) return;
    const parsed = await plugin.parse(modelsPath, {});
    const generator = new IRGenerator();
    const ir = await generator.generate(parsed, {
      projectName: 'test',
      schemaFormat: 'sqlalchemy',
      adapter: 'fastapi',
    });

    const validation = generator.validate(ir);
    expect(validation.valid).toBe(true);
    expect(ir.entities).toHaveLength(2);
  });
});
