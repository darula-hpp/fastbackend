import type { IRField } from '../utils/ir-loader.js';

export interface FilterSpec {
  field: string;
  operator: string;
  value: unknown;
}

export class QueryEngine {
  parsePagination(limit = 20, offset = 0): { limit: number; offset: number } {
    return {
      limit: Math.min(Math.max(limit, 1), 100),
      offset: Math.max(offset, 0),
    };
  }

  parseSort(sort: string | undefined, allowedFields: string[]): Array<{ field: string; direction: 'asc' | 'desc' }> {
    if (!sort) {
      return [];
    }

    const result: Array<{ field: string; direction: 'asc' | 'desc' }> = [];
    for (const part of sort.split(',')) {
      const trimmed = part.trim();
      if (!trimmed) {
        continue;
      }

      const [field, direction = 'asc'] = trimmed.includes(':') ? trimmed.split(':') : [trimmed, 'asc'];
      if (allowedFields.includes(field)) {
        result.push({ field, direction: direction.toLowerCase() === 'desc' ? 'desc' : 'asc' });
      }
    }

    return result;
  }

  parseFilters(params: Record<string, unknown>, entityFields: IRField[]): FilterSpec[] {
    const fieldNames = new Set(entityFields.map((field) => field.name));
    const filters: FilterSpec[] = [];

    for (const [key, value] of Object.entries(params)) {
      if (['limit', 'offset', 'sort', 'q'].includes(key) || value === undefined) {
        continue;
      }

      const [fieldName, operator = 'eq'] = key.includes('__') ? key.split('__') : [key, 'eq'];
      if (fieldNames.has(fieldName)) {
        filters.push({ field: fieldName, operator, value });
      }
    }

    return filters;
  }

  buildPrismaWhere(
    filters: FilterSpec[],
    search: string | undefined,
    textFields: string[],
  ): Record<string, unknown> | undefined {
    const clauses: Record<string, unknown>[] = [];

    for (const filter of filters) {
      clauses.push({ [filter.field]: this.operatorToPrisma(filter.operator, filter.value) });
    }

    if (search && textFields.length > 0) {
      clauses.push({
        OR: textFields.map((field) => ({
          [field]: { contains: search, mode: 'insensitive' },
        })),
      });
    }

    if (clauses.length === 0) {
      return undefined;
    }

    if (clauses.length === 1) {
      return clauses[0];
    }

    return { AND: clauses };
  }

  buildPrismaOrderBy(
    sortSpec: Array<{ field: string; direction: 'asc' | 'desc' }>,
  ): Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>> | undefined {
    if (sortSpec.length === 0) {
      return undefined;
    }

    if (sortSpec.length === 1) {
      const [entry] = sortSpec;
      return entry ? { [entry.field]: entry.direction } : undefined;
    }

    return sortSpec.map((entry) => ({ [entry.field]: entry.direction }));
  }

  private operatorToPrisma(operator: string, value: unknown): unknown {
    switch (operator) {
      case 'eq':
        return value;
      case 'ne':
        return { not: value };
      case 'gt':
        return { gt: value };
      case 'lt':
        return { lt: value };
      case 'gte':
        return { gte: value };
      case 'lte':
        return { lte: value };
      case 'like':
        return { contains: String(value), mode: 'insensitive' };
      default:
        return value;
    }
  }
}
