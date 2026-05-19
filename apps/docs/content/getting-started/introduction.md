---
title: Introduction
description: Schema-driven backend runtime that serves REST APIs from SQLAlchemy or Prisma schemas.
---

# Introduction

FastBackend automates the repetitive ~90% of backend work: CRUD, relationships, validation, filtering, and OpenAPI from your database schema. You write custom code only for business logic — overrides and custom routes for the 10% that matters.

FastBackend is a **backend runtime**, not a codegen tool. Your schema compiles to a framework-agnostic **IR**. A runtime adapter **serves** REST routes in memory at startup. OpenAPI is written to disk for frontend tools and API consumers.

```
Schema → IR → runtime adapter → live REST + OpenAPI
```

## Runtime vs codegen

| FastBackend is | FastBackend is not |
|----------------|-------------------|
| A runtime that serves routes from IR at startup | A tool that writes CRUD route files you maintain |
| IR + OpenAPI on disk | Generated routers committed to git |
| Custom routes for business logic | A replacement for all backend code |

## What gets written vs what runs

| Written to disk | Runtime only (in memory) |
|-----------------|--------------------------|
| `.fastbackend/ir.json` | REST routes (CRUD, relationships, custom) |
| `.fastbackend/openapi.yaml` | Validation (Pydantic or Zod) |
| | Query builders |

## What you own

| You own | FastBackend never modifies |
|---------|---------------------------|
| `models.py` / `schema.prisma` | Schema files |
| `fastbackend.yaml` | Config |
| `app/custom/*` or `src/custom/*` | Custom endpoints |

## Runtime adapters

| Adapter | Stack | Schema formats |
|---------|-------|----------------|
| **FastAPI** | Python | SQLAlchemy, Prisma |
| **Express** | TypeScript | Prisma |

`@fastbackend/core` and `@fastbackend/cli` are adapter-agnostic.

## Frontend integration

`fastbackend generate` writes `.fastbackend/openapi.yaml`. Any frontend can consume it:

- **Vue / React / Svelte / Angular**: Orval, openapi-typescript, Hey API
- **[UIGen](https://github.com/darula-hpp/uigen)**: React admin UI from the same OpenAPI file

OpenAPI is the handoff point between backend and frontend.

## Packages

Published on npm:

- [`@fastbackend/core`](https://www.npmjs.com/package/@fastbackend/core) — schema parsing, IR, OpenAPI
- [`@fastbackend/cli`](https://www.npmjs.com/package/@fastbackend/cli) — command-line interface
- [`@fastbackend/express`](https://www.npmjs.com/package/@fastbackend/express) — Express + Prisma runtime

Published on PyPI:

- [`fastbackend-fastapi`](https://pypi.org/project/fastbackend-fastapi/) — FastAPI runtime adapter

## Roadmap

Planned (not shipped yet): declarative wiring for storage, OAuth, and other services — provider + URLs in `fastbackend.yaml`, secrets in `.env`. Same philosophy: automate boilerplate, custom code when you need it.

## Examples

- [SQLAlchemy + FastAPI](https://github.com/darula-hpp/fastbackend/tree/main/examples/sqlalchemy-fastapi)
- [Prisma + FastAPI](https://github.com/darula-hpp/fastbackend/tree/main/examples/prisma-fastapi)
- [Prisma + Express](https://github.com/darula-hpp/fastbackend/tree/main/examples/prisma-express)
