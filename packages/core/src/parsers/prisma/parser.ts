import { readFileSync } from 'node:fs';
import { SchemaParseError } from '../../errors/index.js';
import type {
  ParsedSchema,
  ParsedEntity,
  ParsedField,
  ParsedRelationship,
  ParsedEnum,
  ValidationRule,
  RelationshipType,
} from '../../ir/types.js';

interface PrismaModel {
  name: string;
  fields: PrismaField[];
}

interface PrismaField {
  name: string;
  type: string;
  isOptional: boolean;
  isList: boolean;
  isId: boolean;
  isUnique: boolean;
  hasDefaultValue: boolean;
  default?: unknown;
  relationName?: string;
  relationFromFields?: string[];
  relationToFields?: string[];
  relationOnDelete?: string;
}

interface PrismaEnum {
  name: string;
  values: string[];
}

const PRISMA_TO_IR_TYPE: Record<string, string> = {
  String: 'string',
  Int: 'integer',
  BigInt: 'integer',
  Float: 'float',
  Decimal: 'float',
  Boolean: 'boolean',
  DateTime: 'datetime',
  Date: 'date',
  Json: 'json',
  Bytes: 'string',
};

export function parsePrismaSchema(schemaPath: string): ParsedSchema {
  const content = readFileSync(schemaPath, 'utf-8');
  const enums = parseEnums(content);
  const models = parseModels(content, enums);
  const entities = models.map(modelToEntity);
  const relationships = extractRelationships(models);

  return {
    entities,
    relationships,
    enums: enums.map(enumToParsed),
    metadata: {
      schemaFormat: 'prisma',
      schemaVersion: '1.0.0',
      sourceFiles: [schemaPath],
    },
  };
}

function parseEnums(content: string): PrismaEnum[] {
  const enums: PrismaEnum[] = [];
  const enumRegex = /enum\s+(\w+)\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = enumRegex.exec(content)) !== null) {
    const name = match[1];
    const body = match[2];
    const values = body
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('//') && !line.startsWith('@@'))
      .map((line) => line.split(/\s+/)[0]);

    enums.push({ name, values });
  }

  return enums;
}

function parseModels(content: string, enums: PrismaEnum[]): PrismaModel[] {
  const models: PrismaModel[] = [];
  const enumNames = new Set(enums.map((e) => e.name));
  const modelRegex = /model\s+(\w+)\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = modelRegex.exec(content)) !== null) {
    const name = match[1];
    const body = match[2];
    const fields = parseModelFields(body, enumNames);
    models.push({ name, fields });
  }

  return models;
}

function parseModelFields(body: string, enumNames: Set<string>): PrismaField[] {
  const fields: PrismaField[] = [];

  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) {
      continue;
    }

    const field = parseFieldLine(trimmed, enumNames);
    if (field) {
      fields.push(field);
    }
  }

  return fields;
}

function parseFieldLine(line: string, enumNames: Set<string>): PrismaField | null {
  const parts = line.split(/\s+/);
  if (parts.length < 2) return null;

  const name = parts[0];
  let type = parts[1];
  const isList = type.endsWith('[]');
  if (isList) type = type.slice(0, -2);

  let isOptional = false;
  if (type.endsWith('?')) {
    isOptional = true;
    type = type.slice(0, -1);
  }

  const attrs = line.slice(line.indexOf(parts[1]) + parts[1].length);

  const isRelation = attrs.includes('@relation') || (!PRISMA_TO_IR_TYPE[type] && !enumNames.has(type) && !isList && type[0] === type[0].toUpperCase());

  if (isRelation && !attrs.includes('@relation')) {
    return {
      name,
      type,
      isOptional,
      isList,
      isId: false,
      isUnique: false,
      hasDefaultValue: false,
      relationName: name,
    };
  }

  if (attrs.includes('@relation')) {
    const fromMatch = attrs.match(/fields:\s*\[(\w+)\]/);
    const toMatch = attrs.match(/references:\s*\[(\w+)\]/);
    const nameMatch = attrs.match(/@relation\(\s*"(\w+)"/);

    return {
      name,
      type,
      isOptional,
      isList,
      isId: false,
      isUnique: false,
      hasDefaultValue: false,
      relationName: nameMatch?.[1] ?? name,
      relationFromFields: fromMatch ? [fromMatch[1]] : undefined,
      relationToFields: toMatch ? [toMatch[1]] : undefined,
      relationOnDelete: attrs.match(/onDelete:\s*(\w+)/)?.[1],
    };
  }

  return {
    name,
    type: enumNames.has(type) ? `enum:${type}` : type,
    isOptional,
    isList,
    isId: attrs.includes('@id'),
    isUnique: attrs.includes('@unique'),
    hasDefaultValue: attrs.includes('@default'),
    default: attrs.match(/@default\(([^)]+)\)/)?.[1],
  };
}

function modelToEntity(model: PrismaModel): ParsedEntity {
  const scalarFields = model.fields.filter(
    (f) => !f.relationFromFields && !f.relationName?.startsWith('_'),
  );
  const scalarFieldNames = new Set(scalarFields.map((field) => field.name));

  const relationOnlyFields = model.fields.filter(
    (f) => f.relationFromFields && !scalarFieldNames.has(f.relationFromFields[0]),
  );

  const fields: ParsedField[] = [
    ...scalarFields
      .filter((f) => PRISMA_TO_IR_TYPE[f.type] || f.type.startsWith('enum:'))
      .map((f) => ({
        name: f.name,
        type: mapPrismaType(f, model.name),
        nullable: f.isOptional,
        defaultValue: f.default,
        validation: buildValidation(f),
        metadata: {},
      })),
    ...relationOnlyFields.map((f) => ({
      name: f.relationFromFields![0],
      type: 'integer',
      nullable: f.isOptional,
      validation: f.isOptional ? [] : [{ type: 'required' as const }],
      metadata: {},
    })),
  ];

  const pkFields = model.fields.filter((f) => f.isId).map((f) => f.name);
  if (pkFields.length === 0) {
    throw new SchemaParseError('', 'prisma', `Model "${model.name}" must declare an @id field`);
  }

  const uniqueFields = model.fields.filter((f) => f.isUnique).map((f) => f.name);

  return {
    name: model.name,
    tableName: model.name.toLowerCase() + 's',
    fields,
    constraints: [
      { type: 'primary_key' as const, fields: pkFields },
      ...uniqueFields.map((f) => ({ type: 'unique' as const, fields: [f] })),
    ],
    metadata: {},
  };
}

function mapPrismaType(field: PrismaField, modelName: string): string {
  if (field.type.startsWith('enum:')) return field.type;

  const baseType = PRISMA_TO_IR_TYPE[field.type];
  if (!baseType) {
    throw new SchemaParseError('', 'prisma', `Unknown Prisma type "${field.type}" on ${modelName}.${field.name}`);
  }

  if (field.isList) return `array<${baseType}>`;
  return baseType;
}

function buildValidation(field: PrismaField): ValidationRule[] {
  const rules: ValidationRule[] = [];
  if (!field.isOptional && !field.isId) {
    rules.push({ type: 'required' });
  }
  return rules;
}

function extractRelationships(models: PrismaModel[]): ParsedRelationship[] {
  const relationships: ParsedRelationship[] = [];

  for (const model of models) {
    for (const field of model.fields) {
      if (!field.relationFromFields && field.relationName && !PRISMA_TO_IR_TYPE[field.type]) {
        const relType: RelationshipType = field.isList ? 'one-to-many' : 'many-to-one';

        relationships.push({
          name: field.name,
          type: relType,
          sourceEntity: model.name,
          targetEntity: field.type,
          sourceField: field.relationFromFields?.[0],
          targetField: field.relationToFields?.[0],
          cascadeDelete: field.relationOnDelete === 'Cascade',
          metadata: {},
        });
      }

      if (field.relationFromFields) {
        relationships.push({
          name: field.name,
          type: field.isList ? 'one-to-many' : 'many-to-one',
          sourceEntity: model.name,
          targetEntity: field.type,
          sourceField: field.relationFromFields[0],
          targetField: field.relationToFields?.[0],
          cascadeDelete: field.relationOnDelete === 'Cascade',
          metadata: {},
        });
      }
    }
  }

  return dedupeRelationships(relationships);
}

function dedupeRelationships(rels: ParsedRelationship[]): ParsedRelationship[] {
  const seen = new Set<string>();
  return rels.filter((r) => {
    const key = `${r.sourceEntity}:${r.name}:${r.targetEntity}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function enumToParsed(enumDef: PrismaEnum): ParsedEnum {
  return {
    name: enumDef.name,
    values: enumDef.values.map((v) => ({ name: v, value: v })),
    metadata: {},
  };
}
