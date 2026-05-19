---
title: Runtime Architecture
description: FastAPI runtime engines and in-memory route registration.
---

# Runtime Architecture

The `fastbackend-fastapi` package is the Python runtime adapter. It reads IR and builds the application at startup.

For the Express + Prisma adapter, see [Express Runtime Architecture](/docs/core-concepts/express-runtime-architecture).

## Engines

| Engine | Responsibility |
|--------|----------------|
| `ValidationEngine` | Dynamic Pydantic models from IR entities |
| `CRUDEngine` | List, create, retrieve, update, delete routes |
| `RelationshipEngine` | Nested relationship routes (e.g. `/users/{id}/posts`) |
| `QueryEngine` | Pagination, filtering, sorting, search on list endpoints |

## Route Registry

The runtime tracks which routes were registered and which were overridden by custom code. Overridden paths are skipped during CRUD registration.

## Custom Endpoints

Files in `app/custom/` export a FastAPI `router`. The runtime imports each module and calls `app.include_router()`.

## Entry Point

```python
from fastbackend_fastapi import create_app

app = create_app()
```

Defaults:

- IR path: `.fastbackend/ir.json`
- Custom path: `app/custom`

## In-Memory Store

The MVP runtime uses an in-memory store for CRUD operations during development. Production deployments should connect engines to your database layer as adapters evolve.
