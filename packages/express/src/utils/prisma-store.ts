import { toPrismaDelegateKey } from './path-utils.js';
import type { IREntity } from './ir-loader.js';

export interface PrismaFindManyArgs {
  where?: Record<string, unknown>;
  orderBy?: Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>>;
  take?: number;
  skip?: number;
  include?: Record<string, boolean>;
}

export interface PrismaModelDelegate {
  findMany(args?: PrismaFindManyArgs): Promise<Record<string, unknown>[]>;
  findUnique(args: { where: Record<string, unknown> }): Promise<Record<string, unknown> | null>;
  create(args: { data: Record<string, unknown> }): Promise<Record<string, unknown>>;
  update(args: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<Record<string, unknown>>;
  delete(args: { where: Record<string, unknown> }): Promise<Record<string, unknown>>;
}

export type PrismaLikeClient = Record<string, PrismaModelDelegate>;

export class PrismaStore {
  constructor(private readonly client: PrismaLikeClient) {}

  getDelegate(entity: IREntity): PrismaModelDelegate {
    const key = toPrismaDelegateKey(entity.name);
    const delegate = this.client[key];
    if (!delegate) {
      throw new Error(`Prisma delegate not found for entity "${entity.name}" (expected client.${key})`);
    }
    return delegate;
  }

  async ping(): Promise<void> {
    const delegate = Object.values(this.client).find((entry) => typeof entry?.findMany === 'function');
    if (!delegate) {
      throw new Error('No Prisma delegates available on client');
    }
    await delegate.findMany({ take: 1 });
  }

  static async loadFromProject(): Promise<PrismaLikeClient> {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for the Express runtime adapter');
    }

    const mod = await import('@prisma/client');
    const PrismaClient = mod.PrismaClient as new () => PrismaLikeClient & { $connect(): Promise<void> };
    const client = new PrismaClient();
    await client.$connect();
    return client;
  }
}
