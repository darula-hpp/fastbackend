---
title: Installation
description: Install FastBackend CLI, core packages, and runtime adapters.
---

# Installation

## Prerequisites

- Node.js 20+ (CLI, core, Express adapter)
- Python 3.10+ (FastAPI adapter only)
- SQLAlchemy or Prisma schema

## CLI (published)

```bash
npm install -g @fastbackend/cli
```

## Monorepo development

```bash
cd fastbackend
pnpm install && pnpm build
```

Use the local CLI:

```bash
alias fb='node /path/to/fastbackend/packages/cli/dist/index.js'
```

## Express runtime (published)

```bash
npm install @fastbackend/express
```

Requires `@prisma/client` and a generated Prisma schema in your project.

## Express runtime (local development)

```bash
cd fastbackend
pnpm --filter @fastbackend/express build
```

## Python runtime (published)

```bash
pip install fastbackend-fastapi
```

## Python runtime (local development)

```bash
cd fastbackend
pip install -e "packages/fastapi[dev]"
```

## Choose an adapter

| Adapter | Schema formats | Persistence |
|---------|------------------|-------------|
| `fastapi` | SQLAlchemy, Prisma | In-memory MVP |
| `express` | Prisma only | Prisma + database |

```bash
fastbackend init my-api --schema prisma --adapter express
fastbackend init my-api --schema sqlalchemy --adapter fastapi
```

## Docker (optional)

Scaffold Docker templates when initializing:

```bash
fastbackend init my-api --schema sqlalchemy --adapter fastapi --docker
fastbackend init my-api --schema prisma --adapter express --docker
```

Run `fastbackend generate` before building the image so `.fastbackend/ir.json` exists in the container context.
