import { readFileSync, existsSync } from 'node:fs';

export interface IRField {
  name: string;
  type: { base: string; format?: string; arrayOf?: { base: string } };
  nullable: boolean;
  defaultValue?: unknown;
  validation: Array<{ type: string; value?: unknown }>;
}

export interface IREntity {
  name: string;
  fields: IRField[];
  primaryKey?: string[];
}

export interface IRRelationship {
  name: string;
  type: string;
  sourceEntity: string;
  targetEntity: string;
  sourceField?: string;
  targetField?: string;
}

export interface IRDocument {
  version: string;
  metadata: {
    projectName: string;
    schemaFormat: string;
    adapter: string;
    schemaVersion?: string;
  };
  entities: IREntity[];
  relationships: IRRelationship[];
  enums: unknown[];
}

export function loadIr(irPath: string): IRDocument {
  if (!existsSync(irPath)) {
    throw new Error(`IR file not found: ${irPath}`);
  }

  const raw = JSON.parse(readFileSync(irPath, 'utf-8')) as IRDocument;

  if (!raw.entities || !Array.isArray(raw.entities)) {
    throw new Error('Invalid IR: missing entities array');
  }

  return raw;
}
