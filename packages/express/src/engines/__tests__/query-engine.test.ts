import { describe, it, expect } from 'vitest';
import { QueryEngine } from '../query-engine.js';

describe('QueryEngine', () => {
  const engine = new QueryEngine();
  const fields = [
    { name: 'name', type: { base: 'string' }, nullable: false, validation: [] },
    { name: 'email', type: { base: 'string' }, nullable: false, validation: [] },
    { name: 'age', type: { base: 'integer' }, nullable: true, validation: [] },
  ];

  it('clamps pagination values', () => {
    expect(engine.parsePagination(0, -5)).toEqual({ limit: 1, offset: 0 });
    expect(engine.parsePagination(500, 10)).toEqual({ limit: 100, offset: 10 });
  });

  it('parses sort specs and ignores unknown fields', () => {
    expect(engine.parseSort('name:desc,unknown:asc', ['name', 'email'])).toEqual([
      { field: 'name', direction: 'desc' },
    ]);
  });

  it('parses filter query params', () => {
    const filters = engine.parseFilters(
      { name: 'Ada', age__gte: '18', limit: '10', q: 'test' },
      fields,
    );
    expect(filters).toEqual([
      { field: 'name', operator: 'eq', value: 'Ada' },
      { field: 'age', operator: 'gte', value: '18' },
    ]);
  });

  it('builds Prisma where clauses for filters and search', () => {
    const filters = engine.parseFilters({ name__like: 'ada' }, fields);
    const where = engine.buildPrismaWhere(filters, 'grace', ['name', 'email']);

    expect(where).toEqual({
      AND: [
        { name: { contains: 'ada', mode: 'insensitive' } },
        {
          OR: [
            { name: { contains: 'grace', mode: 'insensitive' } },
            { email: { contains: 'grace', mode: 'insensitive' } },
          ],
        },
      ],
    });
  });

  it('maps comparison operators to Prisma filters', () => {
    const filters = [
      { field: 'age', operator: 'gt', value: 21 },
      { field: 'age', operator: 'ne', value: 30 },
    ];
    expect(engine.buildPrismaWhere(filters, undefined, [])).toEqual({
      AND: [{ age: { gt: 21 } }, { age: { not: 30 } }],
    });
  });

  it('builds Prisma orderBy from sort spec', () => {
    expect(engine.buildPrismaOrderBy([{ field: 'name', direction: 'asc' }])).toEqual({
      name: 'asc',
    });
    expect(
      engine.buildPrismaOrderBy([
        { field: 'name', direction: 'asc' },
        { field: 'email', direction: 'desc' },
      ]),
    ).toEqual([{ name: 'asc' }, { email: 'desc' }]);
  });
});
