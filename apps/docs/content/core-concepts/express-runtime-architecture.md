---
title: Express Runtime Architecture
description: Express + Prisma runtime engines and route registration.
---

# Express Runtime Architecture

The `@fastbackend/express` package reads IR and builds an Express app at startup with **Prisma-backed persistence**.

## Engines

| Engine | Responsibility |
|--------|----------------|
| `ValidationEngine` | Dynamic Zod schemas from IR entities |
| `CRUDEngine` | List, create, retrieve, update, delete routes via Prisma Client |
| `RelationshipEngine` | Nested relationship routes (e.g. `/users/:id/posts`) |
| `QueryEngine` | Pagination, filtering, sorting, search mapped to Prisma queries |

## Route Registry

The runtime tracks which routes were registered and which were overridden by custom code. Overridden paths are skipped during CRUD registration.

## Custom Endpoints

Files in `src/custom/` export an Express `router`. The runtime imports each module and mounts it on the app.

## Overrides

Mark a custom handler as an override so runtime CRUD routes are skipped:

```typescript
@fastbackend.override('/users/{id}', 'GET')
router.get('/users/:id', handler);
```

## Entry Point

```typescript
import { startServer } from '@fastbackend/express';

startServer({ port: 3000 });
```

Defaults:

- IR path: `.fastbackend/ir.json`
- Custom path: `src/custom`
- Database: `DATABASE_URL` with Prisma Client

## Supported Schema

Express requires `schema.format: prisma` in `fastbackend.yaml`. SQLAlchemy schemas are supported by the FastAPI adapter only.
