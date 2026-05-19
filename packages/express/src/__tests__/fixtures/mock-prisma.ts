import type { PrismaLikeClient } from '../utils/prisma-store.js';

type Store = Record<string, Record<string, unknown>[]>;

export function createMockPrismaClient(seed: Store = {}): PrismaLikeClient {
  const data: Store = structuredClone(seed);

  const makeDelegate = (model: string) => ({
    async findMany(args?: {
      where?: Record<string, unknown>;
      orderBy?: Record<string, 'asc' | 'desc'>;
      take?: number;
      skip?: number;
    }) {
      let items = [...(data[model] ?? [])];
      if (args?.where) {
        items = items.filter((item) => matchesWhere(item, args.where!));
      }
      if (args?.orderBy) {
        const [field, direction] = Object.entries(args.orderBy)[0] ?? [];
        if (field) {
          items.sort((a, b) => {
            const av = a[field];
            const bv = b[field];
            if (av === bv) return 0;
            if (av === undefined || av === null) return 1;
            if (bv === undefined || bv === null) return -1;
            return av > bv ? (direction === 'desc' ? -1 : 1) : direction === 'desc' ? 1 : -1;
          });
        }
      }
      const skip = args?.skip ?? 0;
      const take = args?.take ?? items.length;
      return items.slice(skip, skip + take);
    },
    async findUnique(args: { where: Record<string, unknown> }) {
      const [field, value] = Object.entries(args.where)[0] ?? [];
      if (!field) return null;
      return (data[model] ?? []).find((item) => item[field] === value) ?? null;
    },
    async create(args: { data: Record<string, unknown> }) {
      const items = data[model] ?? [];
      const nextId = Math.max(0, ...items.map((item) => Number(item.id ?? 0))) + 1;
      const record = { id: nextId, ...args.data };
      items.push(record);
      data[model] = items;
      return record;
    },
    async update(args: { where: Record<string, unknown>; data: Record<string, unknown> }) {
      const [field, value] = Object.entries(args.where)[0] ?? [];
      const items = data[model] ?? [];
      const index = items.findIndex((item) => item[field] === value);
      if (index === -1) {
        throw new Error('Record to update not found');
      }
      items[index] = { ...items[index], ...args.data, [field]: value };
      return items[index];
    },
    async delete(args: { where: Record<string, unknown> }) {
      const [field, value] = Object.entries(args.where)[0] ?? [];
      const items = data[model] ?? [];
      const index = items.findIndex((item) => item[field] === value);
      if (index === -1) {
        throw new Error('Record to delete does not exist');
      }
      const [removed] = items.splice(index, 1);
      return removed;
    },
  });

  return {
    user: makeDelegate('user'),
    post: makeDelegate('post'),
  };
}

function matchesWhere(item: Record<string, unknown>, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (key === 'OR' && Array.isArray(value)) {
      return value.some((clause) => matchesWhere(item, clause as Record<string, unknown>));
    }
    if (key === 'AND' && Array.isArray(value)) {
      return value.every((clause) => matchesWhere(item, clause as Record<string, unknown>));
    }
    if (typeof value === 'object' && value !== null) {
      const current = item[key];
      if ('contains' in value) {
        return String(current).toLowerCase().includes(String(value.contains).toLowerCase());
      }
      if ('gt' in value) return current > value.gt;
      if ('lt' in value) return current < value.lt;
      if ('gte' in value) return current >= value.gte;
      if ('lte' in value) return current <= value.lte;
      if ('not' in value) return current !== value.not;
    }
    return item[key] === value;
  });
}

export const SAMPLE_IR = {
  version: '1.0.0',
  metadata: {
    projectName: 'test-api',
    schemaFormat: 'prisma',
    adapter: 'express',
    schemaVersion: '1.0.0',
  },
  entities: [
    {
      name: 'User',
      primaryKey: ['id'],
      fields: [
        { name: 'id', type: { base: 'integer' }, nullable: false, validation: [] },
        { name: 'name', type: { base: 'string' }, nullable: false, validation: [{ type: 'required' }] },
        { name: 'email', type: { base: 'string', format: 'email' }, nullable: false, validation: [{ type: 'required' }] },
      ],
    },
    {
      name: 'Post',
      primaryKey: ['id'],
      fields: [
        { name: 'id', type: { base: 'integer' }, nullable: false, validation: [] },
        { name: 'title', type: { base: 'string' }, nullable: false, validation: [{ type: 'required' }] },
        { name: 'content', type: { base: 'string' }, nullable: true, validation: [] },
        { name: 'authorId', type: { base: 'integer' }, nullable: false, validation: [{ type: 'required' }] },
      ],
    },
  ],
  relationships: [
    {
      name: 'posts',
      type: 'one-to-many',
      sourceEntity: 'User',
      targetEntity: 'Post',
      targetField: 'authorId',
    },
  ],
  enums: [],
};
