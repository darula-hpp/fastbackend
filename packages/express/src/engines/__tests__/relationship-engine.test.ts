import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { RelationshipEngine } from '../relationship-engine.js';
import { RouteRegistry } from '../../utils/route-registry.js';
import { PrismaStore } from '../../utils/prisma-store.js';
import { createMockPrismaClient } from '../../__tests__/fixtures/mock-prisma.js';
import type { IRRelationship } from '../../utils/ir-loader.js';

function buildRelationshipApp(
  relationships: IRRelationship[],
  seed: Parameters<typeof createMockPrismaClient>[0] = {},
) {
  const app = express();
  const registry = new RouteRegistry();
  const store = new PrismaStore(createMockPrismaClient(seed));
  const engine = new RelationshipEngine(registry, store, relationships);

  engine.registerAll(app);
  return { app, registry };
}

describe('RelationshipEngine', () => {
  it('serves one-to-many related records with pagination', async () => {
    const { app } = buildRelationshipApp(
      [
        {
          name: 'posts',
          type: 'one-to-many',
          sourceEntity: 'User',
          targetEntity: 'Post',
          targetField: 'authorId',
        },
      ],
      {
        user: [{ id: 1, name: 'Ada', email: 'ada@example.com' }],
        post: [
          { id: 1, title: 'First', content: 'A', authorId: 1 },
          { id: 2, title: 'Second', content: 'B', authorId: 1 },
          { id: 3, title: 'Other', content: 'C', authorId: 2 },
        ],
      },
    );

    const response = await request(app).get('/users/1/posts?limit=1&offset=1');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe('Second');
  });

  it('serves many-to-one related records', async () => {
    const { app } = buildRelationshipApp(
      [
        {
          name: 'author',
          type: 'many-to-one',
          sourceEntity: 'Post',
          targetEntity: 'User',
          sourceField: 'authorId',
        },
      ],
      {
        user: [{ id: 1, name: 'Ada', email: 'ada@example.com' }],
        post: [{ id: 10, title: 'Hello', content: 'World', authorId: 1 }],
      },
    );

    const response = await request(app).get('/posts/10/author');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe('Ada');
  });

  it('serves one-to-one related records', async () => {
    const { app } = buildRelationshipApp(
      [
        {
          name: 'profile',
          type: 'one-to-one',
          sourceEntity: 'User',
          targetEntity: 'Post',
          targetField: 'authorId',
        },
      ],
      {
        user: [{ id: 1, name: 'Ada', email: 'ada@example.com' }],
        post: [{ id: 5, title: 'Profile post', content: null, authorId: 1 }],
      },
    );

    const response = await request(app).get('/users/1/profile');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe('Profile post');
  });

  it('serves many-to-many related records', async () => {
    const { app } = buildRelationshipApp(
      [
        {
          name: 'tags',
          type: 'many-to-many',
          sourceEntity: 'Post',
          targetEntity: 'Post',
        },
      ],
      {
        post: [
          { id: 1, title: 'Tagged', content: 'A', authorId: 1 },
          { id: 2, title: 'Other', content: 'B', authorId: 1 },
        ],
      },
    );

    const response = await request(app).get('/posts/1/tags?limit=1');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  it('returns 404 when the source record is missing', async () => {
    const { app } = buildRelationshipApp(
      [
        {
          name: 'posts',
          type: 'one-to-many',
          sourceEntity: 'User',
          targetEntity: 'Post',
          targetField: 'authorId',
        },
      ],
      { user: [], post: [] },
    );

    const response = await request(app).get('/users/404/posts');
    expect(response.status).toBe(404);
    expect(response.body.detail).toBe('User not found');
  });

  it('skips registration when the relationship route is overridden', () => {
    const app = express();
    const registry = new RouteRegistry();
    registry.markOverride('GET', '/users/{id}/posts');

    const store = new PrismaStore(createMockPrismaClient());
    const engine = new RelationshipEngine(registry, store, [
      {
        name: 'posts',
        type: 'one-to-many',
        sourceEntity: 'User',
        targetEntity: 'Post',
        targetField: 'authorId',
      },
    ]);

    const count = engine.registerAll(app);
    expect(count).toBe(0);
  });
});
