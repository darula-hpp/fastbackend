import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createApp } from '../runtime.js';
import { createMockPrismaClient, SAMPLE_IR } from './fixtures/mock-prisma.js';

describe('@fastbackend/express runtime', () => {
  let tempDir: string;
  let irPath: string;

  beforeAll(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'fb-express-'));
    irPath = join(tempDir, 'ir.json');
    writeFileSync(irPath, JSON.stringify(SAMPLE_IR));
  });

  beforeEach(() => {
    mkdirSync(join(tempDir, 'custom-empty'), { recursive: true });
  });

  async function buildApp(seed?: Parameters<typeof createMockPrismaClient>[0], customPath?: string) {
    return createApp({
      irPath,
      customPath: customPath ?? join(tempDir, 'custom-empty'),
      prisma: createMockPrismaClient(seed),
    });
  }

  it('registers CRUD and relationship routes backed by Prisma', async () => {
    const app = await buildApp({
      user: [{ id: 1, name: 'Ada', email: 'ada@example.com' }],
      post: [{ id: 1, title: 'Hello', content: 'World', authorId: 1 }],
    });

    const health = await request(app).get('/health');
    expect(health.status).toBe(200);
    expect(health.body.status).toBe('healthy');

    const users = await request(app).get('/users');
    expect(users.status).toBe(200);
    expect(users.body).toHaveLength(1);

    const created = await request(app).post('/users').send({ name: 'Grace', email: 'grace@example.com' });
    expect(created.status).toBe(201);
    expect(created.body.name).toBe('Grace');

    const posts = await request(app).get('/users/1/posts');
    expect(posts.status).toBe(200);
    expect(posts.body).toHaveLength(1);
  });

  it('validates create payloads with Zod', async () => {
    const app = await buildApp();
    const response = await request(app).post('/users').send({ name: 'Missing email' });
    expect(response.status).toBe(422);
  });

  it('supports retrieve, update, delete, and 404 paths', async () => {
    const app = await buildApp({
      user: [{ id: 1, name: 'Ada', email: 'ada@example.com' }],
      post: [],
    });

    const missing = await request(app).get('/users/99');
    expect(missing.status).toBe(404);

    const updated = await request(app).put('/users/1').send({ name: 'Updated' });
    expect(updated.status).toBe(200);
    expect(updated.body.name).toBe('Updated');

    const deleted = await request(app).delete('/users/1');
    expect(deleted.status).toBe(204);

    const gone = await request(app).get('/users/1');
    expect(gone.status).toBe(404);
  });

  it('applies pagination, sort, filter, and search query params', async () => {
    const app = await buildApp({
      user: [
        { id: 1, name: 'Ada', email: 'ada@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
        { id: 3, name: 'Grace', email: 'grace@example.com' },
      ],
      post: [],
    });

    const filtered = await request(app).get('/users?name=Ada');
    expect(filtered.body).toHaveLength(1);

    const searched = await request(app).get('/users?q=grace');
    expect(searched.body).toHaveLength(1);
    expect(searched.body[0].email).toBe('grace@example.com');

    const paginated = await request(app).get('/users?limit=1&offset=1&sort=name:desc');
    expect(paginated.body).toHaveLength(1);
    expect(paginated.body[0].name).toBe('Bob');
  });

  it('skips overridden CRUD routes and mounts custom handlers', async () => {
    const customDir = join(tempDir, 'custom-overrides');
    mkdirSync(customDir, { recursive: true });
    writeFileSync(
      join(customDir, 'users.ts'),
      `// @fastbackend.override('/users/{id}', 'GET')
export const router = (req: any, res: any, next: any) => {
  if (req.method === 'GET' && /^\\/users\\/[^/]+$/.test(req.path)) {
    return res.status(200).json({ overridden: true });
  }
  return next();
};`,
    );

    const app = await buildApp(
      { user: [{ id: 1, name: 'Ada', email: 'ada@example.com' }], post: [] },
      customDir,
    );

    const response = await request(app).get('/users/1');
    expect(response.status).toBe(200);
    expect(response.body.overridden).toBe(true);
  });

  it('fails initialization when IR path is invalid', async () => {
    await expect(
      createApp({
        irPath: join(tempDir, 'missing.json'),
        prisma: createMockPrismaClient(),
      }),
    ).rejects.toThrow(/Failed to initialize runtime/);
  });
});
