---
title: How It Works
description: Schema to IR to runtime routes — the FastBackend pipeline.
---

# How It Works

FastBackend follows a three-stage pipeline:

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

## Stage 1: Schema Parsing

The CLI reads your schema file and parses entities, fields, relationships, and enums.

Supported formats:

- **SQLAlchemy** (`models.py`)
- **Prisma** (`schema.prisma`)

## Stage 2: IR Generation

The parser output is normalized into a versioned Intermediate Representation (IR) at `.fastbackend/ir.json`.

OpenAPI is generated from the IR at `.fastbackend/openapi.yaml`.

**No route code is generated.** FastBackend does not write CRUD routers to disk.

## Stage 3: Runtime

The FastAPI adapter reads IR at startup and dynamically registers:

- CRUD routes per entity
- Relationship routes
- Custom endpoints from `app/custom/`
- Health check at `/health`

Pydantic models are created at runtime for request validation.

## Watch Mode

When `development.watch` is enabled in `fastbackend.yaml`, the CLI watches your schema and config files and re-runs `generate` on change. Uvicorn hot-reload picks up Python changes in custom endpoints.
