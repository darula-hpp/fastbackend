import { existsSync } from 'node:fs';
import type { ParserConfig } from '../../config/types.js';
import type { ParsedSchema, ValidationResult } from '../../ir/types.js';
import type { SchemaParserPlugin } from '../plugin-interface.js';
import { SchemaParseError } from '../../errors/index.js';
import { parsePrismaSchema } from './parser.js';

export class PrismaPlugin implements SchemaParserPlugin {
  name = 'prisma';
  supportedFormats = ['prisma'];

  async parse(schemaPath: string, _config: ParserConfig): Promise<ParsedSchema> {
    if (!existsSync(schemaPath)) {
      throw new SchemaParseError(schemaPath, this.name, 'Schema file not found');
    }

    try {
      return parsePrismaSchema(schemaPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new SchemaParseError(schemaPath, this.name, message);
    }
  }

  async validate(schemaPath: string): Promise<ValidationResult> {
    if (!existsSync(schemaPath)) {
      return { valid: false, errors: [`Schema file not found: ${schemaPath}`] };
    }

    if (!schemaPath.endsWith('.prisma')) {
      return { valid: false, errors: ['Prisma schema must be a .prisma file'] };
    }

    return { valid: true, errors: [] };
  }
}

export const prismaPlugin = new PrismaPlugin();
