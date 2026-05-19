import { existsSync } from 'node:fs';
import type { ParserConfig } from '../../config/types.js';
import type { ParsedSchema, ValidationResult } from '../../ir/types.js';
import type { SchemaParserPlugin } from '../plugin-interface.js';
import { SubprocessRunner } from '../subprocess-runner.js';
import { SchemaParseError } from '../../errors/index.js';
import { resolveColocatedAsset } from '../../assets/locator.js';

const PARSER_PATH = resolveColocatedAsset(import.meta.url, 'parser.py');

export class SQLAlchemyPlugin implements SchemaParserPlugin {
  name = 'sqlalchemy';
  supportedFormats = ['sqlalchemy'];

  private runner = new SubprocessRunner();

  async parse(schemaPath: string, _config: ParserConfig): Promise<ParsedSchema> {
    if (!existsSync(schemaPath)) {
      throw new SchemaParseError(schemaPath, this.name, 'Schema file not found');
    }

    try {
      const result = await this.runner.spawnAndParse('python3', [PARSER_PATH, schemaPath]);
      return result.data as ParsedSchema;
    } catch (error) {
      if (error instanceof SchemaParseError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);
      throw new SchemaParseError(schemaPath, this.name, message);
    }
  }

  async validate(schemaPath: string): Promise<ValidationResult> {
    if (!existsSync(schemaPath)) {
      return { valid: false, errors: [`Schema file not found: ${schemaPath}`] };
    }

    if (!schemaPath.endsWith('.py')) {
      return { valid: false, errors: ['SQLAlchemy schema must be a Python file (.py)'] };
    }

    return { valid: true, errors: [] };
  }
}

export const sqlalchemyPlugin = new SQLAlchemyPlugin();
