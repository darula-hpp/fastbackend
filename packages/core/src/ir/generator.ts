import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type {
  GeneratorConfig,
  IR,
  IREntity,
  IRField,
  IRFieldType,
  IRRelationship,
  IREnum,
  ParsedSchema,
  ParsedField,
  ParsedRelationship,
  ValidationRule,
} from './types.js';
import { IR_VERSION } from './types.js';
import { IRValidator } from './validator.js';
import { CodeGenerationError, IRValidationError } from '../errors/index.js';

const TYPE_MAP: Record<string, IRFieldType> = {
  string: { base: 'string' },
  str: { base: 'string' },
  text: { base: 'string' },
  varchar: { base: 'string' },
  char: { base: 'string' },
  integer: { base: 'integer' },
  int: { base: 'integer' },
  bigint: { base: 'integer' },
  smallint: { base: 'integer' },
  boolean: { base: 'boolean' },
  bool: { base: 'boolean' },
  float: { base: 'float' },
  double: { base: 'float' },
  numeric: { base: 'float' },
  decimal: { base: 'float' },
  date: { base: 'date' },
  datetime: { base: 'datetime' },
  timestamp: { base: 'datetime' },
  json: { base: 'json' },
  jsonb: { base: 'json' },
  uuid: { base: 'string', format: 'uuid' },
  email: { base: 'string', format: 'email' },
  enum: { base: 'enum' },
};

export class IRGenerator {
  private validator = new IRValidator();

  async generate(parsedSchema: ParsedSchema, config: GeneratorConfig): Promise<IR> {
    const entities = parsedSchema.entities.map((entity) => this.convertEntity(entity));
    const relationships = parsedSchema.relationships.map((rel) =>
      this.convertRelationship(rel),
    );
    const enums: IREnum[] = (parsedSchema.enums ?? []).map((e) => ({
      name: e.name,
      values: e.values,
      metadata: e.metadata ?? {},
    }));

    if (!parsedSchema.metadata.schemaVersion) {
      throw new CodeGenerationError(
        'IRGenerator',
        'Parsed schema metadata must include schemaVersion',
      );
    }

    const ir: IR = {
      version: IR_VERSION,
      metadata: {
        projectName: config.projectName,
        schemaFormat: config.schemaFormat,
        adapter: config.adapter,
        generatedAt: new Date().toISOString(),
        schemaVersion: parsedSchema.metadata.schemaVersion,
      },
      entities,
      relationships,
      enums,
    };

    const validation = this.validate(ir);
    if (!validation.valid) {
      throw new IRValidationError(
        validation.errors.map((message) => ({ path: '', message })),
        ir,
      );
    }

    return ir;
  }

  validate(ir: IR): ReturnType<IRValidator['validate']> {
    return this.validator.validate(ir);
  }

  async write(ir: IR, outputPath: string): Promise<void> {
    const validation = this.validate(ir);
    if (!validation.valid) {
      const invalidPath = outputPath.replace(/ir\.json$/, 'ir.invalid.json');
      mkdirSync(dirname(invalidPath), { recursive: true });
      writeFileSync(invalidPath, JSON.stringify(ir, null, 2), 'utf-8');
      throw new IRValidationError(
        validation.errors.map((message) => ({ path: '', message })),
        ir,
      );
    }

    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(ir, null, 2), 'utf-8');
  }

  private convertEntity(entity: ParsedSchema['entities'][0]): IREntity {
    const primaryKeyFields = entity.constraints
      .filter((c) => c.type === 'primary_key')
      .flatMap((c) => c.fields);

    if (primaryKeyFields.length === 0) {
      throw new CodeGenerationError(
        'IRGenerator',
        `Entity "${entity.name}" must declare a primary key constraint`,
      );
    }

    const uniqueConstraints = entity.constraints
      .filter((c) => c.type === 'unique')
      .map((c) => c.fields);

    return {
      name: entity.name,
      tableName: entity.tableName,
      fields: entity.fields.map((field) => this.convertField(field, entity.name)),
      primaryKey: primaryKeyFields,
      uniqueConstraints,
      indexes: [],
      metadata: entity.metadata ?? {},
    };
  }

  private convertField(field: ParsedField, entityName: string): IRField {
    return {
      name: field.name,
      type: this.mapFieldType(field.type, entityName, field.name),
      nullable: field.nullable,
      defaultValue: field.defaultValue,
      validation: field.validation ?? [],
      metadata: field.metadata ?? {},
    };
  }

  private mapFieldType(type: string, entityName: string, fieldName: string): IRFieldType {
    const normalized = type.toLowerCase().replace(/\(.*\)/, '');

    if (normalized.startsWith('array<')) {
      const inner = normalized.slice(6, -1);
      return { base: 'array', arrayOf: this.mapFieldType(inner, entityName, fieldName) };
    }

    if (normalized.startsWith('enum:')) {
      return { base: 'enum', enumRef: type.slice(5) };
    }

    const mapped = TYPE_MAP[normalized];
    if (!mapped) {
      throw new CodeGenerationError(
        'IRGenerator',
        `Unknown field type "${type}" on ${entityName}.${fieldName}`,
      );
    }

    return mapped;
  }

  private convertRelationship(rel: ParsedRelationship): IRRelationship {
    return {
      name: rel.name,
      type: rel.type,
      sourceEntity: rel.sourceEntity,
      targetEntity: rel.targetEntity,
      sourceField: rel.sourceField,
      targetField: rel.targetField,
      joinTable: rel.joinTable,
      cascadeDelete: rel.cascadeDelete ?? false,
      metadata: rel.metadata ?? {},
    };
  }
}

export function inferValidationRules(field: ParsedField): ValidationRule[] {
  const rules: ValidationRule[] = [];
  if (!field.nullable) {
    rules.push({ type: 'required' });
  }
  return [...rules, ...(field.validation ?? [])];
}
