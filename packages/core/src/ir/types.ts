/**
 * Intermediate Representation (IR) types for FastBackend.
 * IR is the contract between Core and Runtime Engines.
 */

export const IR_VERSION = '1.0.0';

export type RelationshipType =
  | 'one-to-one'
  | 'one-to-many'
  | 'many-to-one'
  | 'many-to-many';

export type ValidationType =
  | 'required'
  | 'min'
  | 'max'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'email'
  | 'url'
  | 'uuid'
  | 'custom';

export interface ValidationRule {
  type: ValidationType;
  value?: unknown;
  message?: string;
}

export interface IRFieldType {
  base: string;
  format?: string;
  enumRef?: string;
  arrayOf?: IRFieldType;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface FieldMetadata {
  description?: string;
  example?: unknown;
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  uigenAnnotations?: Record<string, unknown>;
}

export interface EntityMetadata {
  description?: string;
  tags?: string[];
  uigenAnnotations?: Record<string, unknown>;
  customEndpoints?: string[];
}

export interface EnumMetadata {
  description?: string;
  tags?: string[];
}

export interface RelationshipMetadata {
  description?: string;
  backPopulates?: string;
  lazy?: boolean;
}

export interface IRIndex {
  name: string;
  fields: string[];
  unique?: boolean;
}

export interface IRField {
  name: string;
  type: IRFieldType;
  nullable: boolean;
  defaultValue?: unknown;
  validation: ValidationRule[];
  metadata: FieldMetadata;
}

export interface IREntity {
  name: string;
  tableName: string;
  fields: IRField[];
  primaryKey: string[];
  uniqueConstraints: string[][];
  indexes: IRIndex[];
  metadata: EntityMetadata;
}

export interface IRRelationship {
  name: string;
  type: RelationshipType;
  sourceEntity: string;
  targetEntity: string;
  sourceField?: string;
  targetField?: string;
  joinTable?: string;
  cascadeDelete: boolean;
  metadata: RelationshipMetadata;
}

export interface IREnumValue {
  name: string;
  value: string | number;
  description?: string;
}

export interface IREnum {
  name: string;
  values: IREnumValue[];
  metadata: EnumMetadata;
}

export interface IRMetadata {
  projectName: string;
  schemaFormat: string;
  adapter: string;
  generatedAt: string;
  schemaVersion: string;
}

export interface IR {
  version: string;
  metadata: IRMetadata;
  entities: IREntity[];
  relationships: IRRelationship[];
  enums: IREnum[];
}

/** Parsed schema types from parser plugins */
export interface ParsedSchema {
  entities: ParsedEntity[];
  relationships: ParsedRelationship[];
  enums?: ParsedEnum[];
  metadata: SchemaMetadata;
}

export interface SchemaMetadata {
  schemaFormat: string;
  schemaVersion?: string;
  sourceFiles?: string[];
}

export interface ParsedEntity {
  name: string;
  tableName: string;
  fields: ParsedField[];
  constraints: ParsedConstraint[];
  metadata: EntityMetadata;
}

export interface ParsedField {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: unknown;
  validation?: ValidationRule[];
  metadata: FieldMetadata;
}

export interface ParsedConstraint {
  type: 'primary_key' | 'foreign_key' | 'unique' | 'check';
  fields: string[];
  references?: {
    entity: string;
    fields: string[];
  };
}

export interface ParsedRelationship {
  name: string;
  type: RelationshipType;
  sourceEntity: string;
  targetEntity: string;
  sourceField?: string;
  targetField?: string;
  joinTable?: string;
  cascadeDelete?: boolean;
  metadata?: RelationshipMetadata;
}

export interface ParsedEnum {
  name: string;
  values: IREnumValue[];
  metadata?: EnumMetadata;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface GeneratorConfig {
  projectName: string;
  schemaFormat: string;
  adapter: string;
}
