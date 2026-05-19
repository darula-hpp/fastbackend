import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { CRUDEngine, registerErrorHandler } from '../crud-engine.js';
import { ValidationEngine } from '../validation-engine.js';
import { RouteRegistry } from '../../utils/route-registry.js';
import { PrismaStore } from '../../utils/prisma-store.js';
import { createMockPrismaClient } from '../../__tests__/fixtures/mock-prisma.js';
import type { IREntity } from '../../utils/ir-loader.js';

const USER_ENTITY: IREntity = {
  name: 'User',
  primaryKey: ['id'],
  fields: [
    { name: 'id', type: { base: 'integer' }, nullable: false, validation: [] },
    { name: 'name', type: { base: 'string' }, nullable: false, validation: [{ type: 'required' }] },
    { name: 'email', type: { base: 'string', format: 'email' }, nullable: false, validation: [{ type: 'required' }] },
  ],
};

function buildCrudApp(seed?: Parameters<typeof createMockPrismaClient>[0]) {
  const app = express();
  app.use(express.json());

  const registry = new RouteRegistry();
  const store = new PrismaStore(createMockPrismaClient(seed));
  const validationEngine = new ValidationEngine();
  validationEngine.createSchemas(USER_ENTITY);

  const crudEngine = new CRUDEngine(registry, store, validationEngine);
  crudEngine.registerEntity(app, USER_ENTITY);
  registerErrorHandler(app);

  return { app, registry };
}

describe('CRUDEngine', () => {
  it('registers five CRUD routes for an entity', () => {
    const { app, registry } = buildCrudApp();
    const summary = registry.summary();
    expect(summary.routeCount).toBe(2);
    expect(summary.routes).toHaveProperty('/users');
    expect(summary.routes).toHaveProperty('/users/{id}');
    expect(summary.routes['/users']).toEqual(expect.arrayContaining(['GET', 'POST']));
    expect(summary.routes['/users/{id}']).toEqual(expect.arrayContaining(['GET', 'PUT', 'DELETE']));
    expect(app).toBeDefined();
  });

  it('skips overridden routes during registration', () => {
    const app = express();
    app.use(express.json());

    const registry = new RouteRegistry();
    registry.markOverride('GET', '/users/{id}');

    const store = new PrismaStore(createMockPrismaClient());
    const validationEngine = new ValidationEngine();
    validationEngine.createSchemas(USER_ENTITY);

    const crudEngine = new CRUDEngine(registry, store, validationEngine);
    const count = crudEngine.registerEntity(app, USER_ENTITY);

    expect(count).toBe(4);
    expect(registry.isOverridden('GET', '/users/{id}')).toBe(true);
  });

  it('lists, creates, retrieves, updates, and deletes records', async () => {
    const { app } = buildCrudApp({
      user: [{ id: 1, name: 'Ada', email: 'ada@example.com' }],
    });

    const list = await request(app).get('/users');
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);

    const created = await request(app).post('/users').send({ name: 'Grace', email: 'grace@example.com' });
    expect(created.status).toBe(201);
    expect(created.body.name).toBe('Grace');

    const retrieved = await request(app).get('/users/1');
    expect(retrieved.status).toBe(200);
    expect(retrieved.body.email).toBe('ada@example.com');

    const updated = await request(app).put('/users/1').send({ name: 'Updated' });
    expect(updated.status).toBe(200);
    expect(updated.body.name).toBe('Updated');

    const deleted = await request(app).delete('/users/1');
    expect(deleted.status).toBe(204);

    const missing = await request(app).get('/users/1');
    expect(missing.status).toBe(404);
  });

  it('returns 404 when updating or deleting missing records', async () => {
    const { app } = buildCrudApp({ user: [] });

    const updateMissing = await request(app).put('/users/99').send({ name: 'Ghost' });
    expect(updateMissing.status).toBe(404);

    const deleteMissing = await request(app).delete('/users/99');
    expect(deleteMissing.status).toBe(404);
  });

  it('returns 422 for invalid payloads and id parameters', async () => {
    const { app } = buildCrudApp();

    const invalidCreate = await request(app).post('/users').send({ name: 'Missing email' });
    expect(invalidCreate.status).toBe(422);

    const invalidId = await request(app).get('/users/not-a-number');
    expect(invalidId.status).toBe(422);
  });
});
