---
title: Introduction
description: Schema-driven backend runtime that creates REST APIs from SQLAlchemy or Prisma schemas.
---

# Introduction

FastBackend is a schema-driven backend **runtime** that transforms database schemas into dynamic REST APIs with OpenAPI specifications.

It mirrors UIGen's architecture: routes exist only in memory at runtime. Only IR and OpenAPI are written to disk.

## What FastBackend Does

| Written to disk | Runtime only (in memory) |
|-----------------|--------------------------|
| `.fastbackend/ir.json` | FastAPI routes |
| `.fastbackend/openapi.yaml` | Pydantic models |
| | Query builders |

## What You Own

| You own | FastBackend never modifies |
|---------|---------------------------|
| `models.py` / `schema.prisma` | Schema files |
| `fastbackend.yaml` | Config |
| `app/custom/*.py` | Custom endpoints |

## Packages

- `@fastbackend/core` - Schema parsing, IR generation, OpenAPI generation
- `@fastbackend/cli` - Command-line interface
- `@fastbackend/express` - Express + Prisma runtime adapter
- `fastbackend-fastapi` - Python FastAPI runtime adapter

## Examples

- [SQLAlchemy + FastAPI](https://github.com/darula-hpp/uigen/tree/main/fastbackend/examples/sqlalchemy-fastapi)
- [Prisma + FastAPI](https://github.com/darula-hpp/uigen/tree/main/fastbackend/examples/prisma-fastapi)
