import { z } from 'zod';
import type { IRField, IREntity } from '../utils/ir-loader.js';

export class ValidationEngine {
  private readonly schemas = new Map<string, z.ZodTypeAny>();

  createSchemas(entity: IREntity): void {
    const full = this.buildSchema(entity, 'full');
    const create = this.buildSchema(entity, 'create');
    const update = this.buildSchema(entity, 'update');

    this.schemas.set(entity.name, full);
    this.schemas.set(`${entity.name}Create`, create);
    this.schemas.set(`${entity.name}Update`, update);
  }

  getSchema(name: string): z.ZodTypeAny | undefined {
    return this.schemas.get(name);
  }

  validatePayload(name: string, body: unknown, partial = false): Record<string, unknown> {
    const schema = this.getSchema(name);
    if (!schema) {
      if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        throw new ValidationError('Request body must be a JSON object');
      }
      return body as Record<string, unknown>;
    }

    const validator = partial && schema instanceof z.ZodObject ? schema.partial() : schema;
    const parsed = validator.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError('Validation failed', parsed.error.flatten());
    }

    return parsed.data as Record<string, unknown>;
  }

  private buildSchema(entity: IREntity, mode: 'full' | 'create' | 'update'): z.ZodObject<Record<string, z.ZodTypeAny>> {
    const pk = entity.primaryKey ?? ['id'];
    const shape: Record<string, z.ZodTypeAny> = {};

    for (const field of entity.fields) {
      if (mode === 'create' && pk.includes(field.name) && field.name === 'id') {
        continue;
      }

      let fieldSchema = this.mapField(field);

      if (mode === 'update') {
        fieldSchema = fieldSchema.optional();
      } else if (field.nullable && mode !== 'create') {
        fieldSchema = fieldSchema.nullable().optional();
      } else if (!field.nullable && mode === 'create') {
        const required = field.validation.some((rule) => rule.type === 'required');
        if (!required && field.defaultValue === undefined) {
          fieldSchema = fieldSchema.optional();
        }
      }

      for (const rule of field.validation) {
        fieldSchema = this.applyRule(fieldSchema, rule, field);
      }

      shape[field.name] = fieldSchema;
    }

    return z.object(shape);
  }

  private mapField(field: IRField): z.ZodTypeAny {
    const base = field.type.base;
    const format = field.type.format;

    switch (base) {
      case 'integer':
        return z.number().int();
      case 'float':
        return z.number();
      case 'boolean':
        return z.boolean();
      case 'date':
      case 'datetime':
        return z.string();
      case 'json':
        return z.record(z.unknown());
      case 'array':
        return z.array(this.mapField({ ...field, type: field.type.arrayOf ?? { base: 'string' } }));
      case 'string':
        if (format === 'email') {
          return z.string().email();
        }
        if (format === 'uuid') {
          return z.string().uuid();
        }
        return z.string();
      default:
        return z.string();
    }
  }

  private applyRule(schema: z.ZodTypeAny, rule: { type: string; value?: unknown }, field: IRField): z.ZodTypeAny {
    switch (rule.type) {
      case 'minLength':
        return schema instanceof z.ZodString ? schema.min(Number(rule.value)) : schema;
      case 'maxLength':
        return schema instanceof z.ZodString ? schema.max(Number(rule.value)) : schema;
      case 'min':
        return schema instanceof z.ZodNumber ? schema.min(Number(rule.value)) : schema;
      case 'max':
        return schema instanceof z.ZodNumber ? schema.max(Number(rule.value)) : schema;
      case 'pattern':
        return schema instanceof z.ZodString ? schema.regex(new RegExp(String(rule.value))) : schema;
      case 'required':
        return field.nullable ? schema : schema;
      default:
        return schema;
    }
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
