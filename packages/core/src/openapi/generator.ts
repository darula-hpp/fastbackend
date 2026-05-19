import { dump as stringifyYaml } from 'js-yaml';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { OpenAPIConfig } from '../config/types.js';
import type { IR, IRField, IREntity, IRRelationship } from '../ir/types.js';

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{ url: string; description?: string }>;
  paths: Record<string, PathItem>;
  components: {
    schemas: Record<string, OpenAPISchema>;
  };
}

interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  delete?: Operation;
  patch?: Operation;
}

interface Operation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, Response>;
  'x-uigen-relationship'?: Record<string, unknown>;
  'x-fastbackend-override'?: boolean;
  [key: string]: unknown;
}

interface Parameter {
  name: string;
  in: 'query' | 'path' | 'header';
  required?: boolean;
  schema: OpenAPISchema;
  description?: string;
}

interface RequestBody {
  required?: boolean;
  content: Record<string, { schema: OpenAPISchema | Reference }>;
}

interface Response {
  description: string;
  content?: Record<string, { schema: OpenAPISchema | Reference }>;
}

interface Reference {
  $ref: string;
}

type OpenAPISchema = {
  type?: string;
  format?: string;
  properties?: Record<string, OpenAPISchema | Reference>;
  required?: string[];
  items?: OpenAPISchema | Reference;
  enum?: (string | number)[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  nullable?: boolean;
  description?: string;
  example?: unknown;
};

function pluralize(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('y')) {
    return `${lower.slice(0, -1)}ies`;
  }
  if (lower.endsWith('s') || lower.endsWith('x') || lower.endsWith('ch') || lower.endsWith('sh')) {
    return `${lower}es`;
  }
  return `${lower}s`;
}

function toSchemaName(entityName: string): string {
  return entityName;
}

function fieldToSchema(field: IRField): OpenAPISchema {
  const schema: OpenAPISchema = {};

  switch (field.type.base) {
    case 'string':
      schema.type = 'string';
      if (field.type.format) schema.format = field.type.format;
      break;
    case 'integer':
      schema.type = 'integer';
      break;
    case 'float':
      schema.type = 'number';
      break;
    case 'boolean':
      schema.type = 'boolean';
      break;
    case 'date':
      schema.type = 'string';
      schema.format = 'date';
      break;
    case 'datetime':
      schema.type = 'string';
      schema.format = 'date-time';
      break;
    case 'json':
      schema.type = 'object';
      break;
    case 'enum':
      schema.type = 'string';
      break;
    case 'array':
      schema.type = 'array';
      if (field.type.arrayOf) {
        schema.items = fieldToSchema({ ...field, type: field.type.arrayOf });
      }
      break;
    default:
      schema.type = 'string';
  }

  if (field.type.min !== undefined) {
    if (schema.type === 'string') schema.minLength = field.type.min;
    else schema.minimum = field.type.min;
  }
  if (field.type.max !== undefined) {
    if (schema.type === 'string') schema.maxLength = field.type.max;
    else schema.maximum = field.type.max;
  }
  if (field.type.pattern) schema.pattern = field.type.pattern;
  if (field.nullable) schema.nullable = true;
  if (field.metadata.description) schema.description = field.metadata.description;
  if (field.metadata.example !== undefined) schema.example = field.metadata.example;

  return schema;
}

export class SchemaBuilder {
  buildEntitySchema(entity: IREntity, mode: 'full' | 'create' | 'update' = 'full'): OpenAPISchema {
    const properties: Record<string, OpenAPISchema> = {};
    const required: string[] = [];

    for (const field of entity.fields) {
      if (mode === 'create' && entity.primaryKey.includes(field.name) && field.name === 'id') {
        continue;
      }
      if (field.metadata.readOnly && mode !== 'full') continue;

      properties[field.name] = fieldToSchema(field);

      const isRequired = field.validation.some((r) => r.type === 'required');
      if (isRequired && mode === 'create') {
        required.push(field.name);
      }
    }

    const schema: OpenAPISchema = { type: 'object', properties };
    if (required.length > 0) schema.required = required;
    if (entity.metadata.description) schema.description = entity.metadata.description;

    return schema;
  }

  buildAllSchemas(ir: IR): Record<string, OpenAPISchema> {
    const schemas: Record<string, OpenAPISchema> = {};

    for (const entity of ir.entities) {
      const name = toSchemaName(entity.name);
      schemas[name] = this.buildEntitySchema(entity, 'full');
      schemas[`${name}Create`] = this.buildEntitySchema(entity, 'create');
      schemas[`${name}Update`] = this.buildEntitySchema(entity, 'update');
    }

    for (const enumDef of ir.enums) {
      schemas[enumDef.name] = {
        type: 'string',
        enum: enumDef.values.map((v) => v.value),
        description: enumDef.metadata.description,
      };
    }

    return schemas;
  }
}

export class PathBuilder {
  buildCRUDPaths(entity: IREntity): Record<string, PathItem> {
    const resource = pluralize(entity.name);
    const schemaName = toSchemaName(entity.name);
    const tag = entity.metadata.tags?.[0] ?? entity.name;

    const listParams: Parameter[] = [
      { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 }, description: 'Maximum number of items to return' },
      { name: 'offset', in: 'query', schema: { type: 'integer', minimum: 0 }, description: 'Number of items to skip' },
      { name: 'sort', in: 'query', schema: { type: 'string' }, description: 'Sort field and direction (e.g., created_at:desc)' },
      { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search query for text fields' },
    ];

    for (const field of entity.fields) {
      if (['string', 'integer', 'boolean', 'date', 'datetime'].includes(field.type.base)) {
        listParams.push({
          name: field.name,
          in: 'query',
          schema: fieldToSchema(field),
          description: `Filter by ${field.name}`,
        });
      }
    }

    return {
      [`/${resource}`]: {
        get: {
          tags: [tag],
          summary: `List ${entity.name} records`,
          operationId: `list${entity.name}`,
          parameters: listParams,
          responses: {
            '200': {
              description: `List of ${entity.name} records`,
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: `#/components/schemas/${schemaName}` } },
                },
              },
            },
          },
        },
        post: {
          tags: [tag],
          summary: `Create ${entity.name}`,
          operationId: `create${entity.name}`,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: `#/components/schemas/${schemaName}Create` },
              },
            },
          },
          responses: {
            '201': {
              description: `Created ${entity.name}`,
              content: {
                'application/json': {
                  schema: { $ref: `#/components/schemas/${schemaName}` },
                },
              },
            },
          },
        },
      },
      [`/${resource}/{id}`]: {
        get: {
          tags: [tag],
          summary: `Get ${entity.name} by ID`,
          operationId: `get${entity.name}`,
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          responses: {
            '200': {
              description: `${entity.name} record`,
              content: {
                'application/json': {
                  schema: { $ref: `#/components/schemas/${schemaName}` },
                },
              },
            },
            '404': { description: 'Not found' },
          },
        },
        put: {
          tags: [tag],
          summary: `Update ${entity.name}`,
          operationId: `update${entity.name}`,
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: `#/components/schemas/${schemaName}Update` },
              },
            },
          },
          responses: {
            '200': {
              description: `Updated ${entity.name}`,
              content: {
                'application/json': {
                  schema: { $ref: `#/components/schemas/${schemaName}` },
                },
              },
            },
            '404': { description: 'Not found' },
          },
        },
        delete: {
          tags: [tag],
          summary: `Delete ${entity.name}`,
          operationId: `delete${entity.name}`,
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          responses: {
            '204': { description: 'Deleted' },
            '404': { description: 'Not found' },
          },
        },
      },
    };
  }

  buildRelationshipPaths(relationship: IRRelationship): Record<string, PathItem> {
    const sourceResource = pluralize(relationship.sourceEntity);
    const tag = relationship.sourceEntity;

    return {
      [`/${sourceResource}/{id}/${relationship.name}`]: {
        get: {
          tags: [tag],
          summary: `Get ${relationship.name} for ${relationship.sourceEntity}`,
          operationId: `get${relationship.sourceEntity}${relationship.name}`,
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'offset', in: 'query', schema: { type: 'integer' } },
          ],
          responses: {
            '200': {
              description: `Related ${relationship.targetEntity} records`,
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: `#/components/schemas/${relationship.targetEntity}` },
                  },
                },
              },
            },
          },
          'x-uigen-relationship': {
            type: relationship.type,
            sourceEntity: relationship.sourceEntity,
            targetEntity: relationship.targetEntity,
            name: relationship.name,
          },
        },
      },
    };
  }
}

export class AnnotationHandler {
  addAnnotations(spec: OpenAPISpec, ir: IR): OpenAPISpec {
    const annotated = structuredClone(spec);

    for (const relationship of ir.relationships) {
      const sourceResource = pluralize(relationship.sourceEntity);
      const path = `/${sourceResource}/{id}/${relationship.name}`;
      const pathItem = annotated.paths[path];

      if (pathItem?.get) {
        pathItem.get['x-uigen-relationship'] = {
          type: relationship.type,
          sourceEntity: relationship.sourceEntity,
          targetEntity: relationship.targetEntity,
          name: relationship.name,
          backPopulates: relationship.metadata.backPopulates,
        };
      }
    }

    return annotated;
  }
}

export class OpenAPIGenerator {
  private schemaBuilder = new SchemaBuilder();
  private pathBuilder = new PathBuilder();
  private annotationHandler = new AnnotationHandler();

  async generate(ir: IR, config: OpenAPIConfig): Promise<OpenAPISpec> {
    const paths: Record<string, PathItem> = {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          operationId: 'healthCheck',
          responses: {
            '200': {
              description: 'Application is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', enum: ['healthy', 'unhealthy'] },
                      database: { type: 'string' },
                    },
                  },
                },
              },
            },
            '503': { description: 'Application is unhealthy' },
          },
        },
      },
    };

    for (const entity of ir.entities) {
      Object.assign(paths, this.pathBuilder.buildCRUDPaths(entity));
    }

    for (const relationship of ir.relationships) {
      Object.assign(paths, this.pathBuilder.buildRelationshipPaths(relationship));
    }

    let spec: OpenAPISpec = {
      openapi: '3.1.0',
      info: {
        title: config.title ?? ir.metadata.projectName,
        version: config.version ?? ir.metadata.schemaVersion,
        description: `Auto-generated OpenAPI spec for ${ir.metadata.projectName}`,
      },
      servers: config.servers ?? [{ url: 'http://localhost:8301', description: 'Development server' }],
      paths,
      components: {
        schemas: this.schemaBuilder.buildAllSchemas(ir),
      },
    };

    if (config.annotations?.relationships !== false) {
      spec = this.annotationHandler.addAnnotations(spec, ir);
    }

    return spec;
  }

  async write(spec: OpenAPISpec, outputPath: string): Promise<void> {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, stringifyYaml(spec, { lineWidth: 120 }), 'utf-8');
  }
}

export { CustomEndpointScanner } from './custom-endpoint-scanner.js';
