import Ajv, { type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import type { IR, ValidationResult } from './types.js';
import { resolveColocatedAsset } from '../assets/locator.js';

const IR_SCHEMA_PATH = resolveColocatedAsset(import.meta.url, 'schema.json');

let ajvInstance: Ajv | null = null;

function getAjv(): Ajv {
  if (!ajvInstance) {
    ajvInstance = new Ajv({ allErrors: true, strict: false });
    addFormats(ajvInstance);
    const schema = JSON.parse(readFileSync(IR_SCHEMA_PATH, 'utf-8'));
    ajvInstance.addSchema(schema, 'ir');
  }
  return ajvInstance;
}

export class IRValidator {
  validate(ir: unknown): ValidationResult {
    const ajv = getAjv();
    const valid = ajv.validate('ir', ir);

    if (valid) {
      return { valid: true, errors: [] };
    }

    const errors = (ajv.errors ?? []).map(formatAjvError);
    return { valid: false, errors };
  }
}

function formatAjvError(error: ErrorObject): string {
  const path = error.instancePath || 'root';
  return `${path}: ${error.message ?? 'validation failed'}`;
}

export function isValidIR(ir: unknown): ir is IR {
  return new IRValidator().validate(ir).valid;
}
