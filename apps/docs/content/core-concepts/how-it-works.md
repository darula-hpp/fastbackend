---
title: How It Works
description: Schema to IR to runtime routes — the FastBackend pipeline.
---

# How It Works

FastBackend follows a schema-first pipeline. The CLI compiles your schema to IR and OpenAPI. The **runtime adapter serves routes in memory** — no CRUD route files are generated on disk.

```
Schema (models.py / schema.prisma)
        ↓
   fastbackend generate
        ↓
  IR + OpenAPI (on disk)
        ↓
   fastbackend dev
        ↓
  Runtime routes (in memory)
```

## Stage 1: Schema parsing

The CLI reads your schema file and parses entities, fields, relationships, and enums.

Supported formats:

- **SQLAlchemy** (`models.py`)
- **Prisma** (`schema.prisma`)

## Stage 2: IR generation

The parser output is normalized into a versioned Intermediate Representation (IR) at `.fastbackend/ir.json`.

OpenAPI is generated from the IR at `.fastbackend/openapi.yaml`.

**No route code is generated.** FastBackend does not write CRUD routers to your project. The IR is the contract the runtime reads at startup.

## Stage 3: Runtime

The runtime adapter reads IR at startup and dynamically registers:

- CRUD routes per entity
- Relationship routes
- Custom endpoints from `app/custom/` or `src/custom/`
- Health check at `/health`

| Adapter | Validation | Persistence |
|---------|------------|-------------|
| FastAPI | Pydantic (runtime) | In-memory MVP |
| Express | Zod (runtime) | Prisma Client |

## Custom code for the 10%

Generated routes cover predictable CRUD and relationships. Use **custom routes** for new endpoints and **overrides** to replace generated handlers. See [Custom Endpoints](/docs/custom-endpoints/overview).

## Watch mode

When `development.watch` is enabled in `fastbackend.yaml`, the CLI watches your schema and config files and re-runs `generate` on change. Hot reload picks up changes in custom endpoint files.

## Frontend handoff

OpenAPI at `.fastbackend/openapi.yaml` is the stable contract for the frontend. **[UIGen](https://github.com/darula-hpp/uigen)** has first-class support: complete UI from the spec at runtime, with overrides for custom views. Orval, openapi-typescript, and similar tools work for typed clients only.
