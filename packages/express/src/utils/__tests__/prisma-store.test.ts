import { describe, it, expect } from 'vitest';
import { PrismaStore } from '../prisma-store.js';
import { createMockPrismaClient } from '../../__tests__/fixtures/mock-prisma.js';

describe('PrismaStore', () => {
  it('resolves delegates by entity name', async () => {
    const store = new PrismaStore(createMockPrismaClient());
    const delegate = store.getDelegate({ name: 'User', fields: [] });

    const created = await delegate.create({ data: { name: 'Ada', email: 'ada@example.com' } });
    expect(created.name).toBe('Ada');
  });

  it('throws when delegate is missing', () => {
    const store = new PrismaStore({});
    expect(() => store.getDelegate({ name: 'Missing', fields: [] })).toThrow(/delegate not found/);
  });

  it('pings database via first available delegate', async () => {
    const store = new PrismaStore(createMockPrismaClient());
    await expect(store.ping()).resolves.toBeUndefined();
  });

  it('requires DATABASE_URL when loading from project', async () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    await expect(PrismaStore.loadFromProject()).rejects.toThrow(/DATABASE_URL is required/);

    process.env.DATABASE_URL = original;
  });
});
