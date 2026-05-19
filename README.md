# FastBackend

Schema-driven backend **runtime** that transforms database schemas into dynamic REST APIs with OpenAPI specifications.

FastBackend ships two runtime adapters:

| Adapter | Stack | Persistence | Best for |
|---------|-------|-------------|----------|
| **FastAPI** | Python | In-memory (MVP) | SQLAlchemy or Prisma schema, Python teams |
| **Express** | TypeScript | Prisma Client | Prisma schema, Node/TypeScript teams |

Core and CLI are adapter-agnostic. They parse your schema, write IR and OpenAPI to disk, and the runtime adapter registers routes in memory.

## How It Works

FastBackend uses a **schema-first pipeline**: your database schema is the source of truth, the CLI generates IR and OpenAPI to disk, and the runtime adapter registers REST routes in memory at startup. No ORM boilerplate, no route files to maintain.

```
CLI Command
    |
    v
+----------------+     +----------------+     +------+     +-------------+
| Schema File    |---->| Schema Parser  |---->|  IR  |---->|  OpenAPI    |
| (Prisma /      |     | Plugin         |     |      |     |  Spec       |
|  SQLAlchemy)   |     +----------------+     +------+     +-------------+
+----------------+           ^                    |               |
       |                     |                    |               |
       |              +----------------+          |         +-------------+
       |              | fastbackend    |          |         | .fastbackend|
       |              | .yaml          |          +-------->| (on disk)   |
       |              +----------------+                    +-------------+
       |
       | (you own schema + config; FastBackend never edits them)
       |
       +----------------------------------------------+
                                                      |
                                                      v
                                               +----------------+
                                               | Runtime Adapter|----> REST API
                                               | FastAPI or     |     (in memory)
                                               | Express        |
                                               +----------------+
                                                      ^
                                               +----------------+
                                               | Custom Routes  |
                                               | & Overrides    |
                                               +----------------+
```

**Generate step:** `@fastbackend/core` parses your schema into a framework-agnostic IR (entities, fields, relationships, validation rules), then emits OpenAPI for downstream tools like UIGen.

**Dev step:** The runtime adapter loads IR, wires CRUD and relationship routes, applies validation (Pydantic or Zod), and mounts your custom endpoints. FastAPI uses an in-memory store today; Express uses Prisma Client against your database.

## Quick Start

### Install the CLI

```bash
npm install -g @fastbackend/cli
```

For monorepo development, build from source instead:

```bash
cd fastbackend
pnpm install && pnpm build
# then use: node packages/cli/dist/index.js ...
```

### FastAPI (Python)

```bash
fastbackend init my-api --schema sqlalchemy --adapter fastapi
cd my-api
pip install -r requirements.txt
fastbackend generate
fastbackend dev
```

### Express (TypeScript + Prisma)

```bash
fastbackend init my-api --schema prisma --adapter express
cd my-api
npm install
cp .env.example .env
npx prisma migrate dev
fastbackend generate
fastbackend dev
```

Express requires a Prisma schema. SQLAlchemy schemas are not supported on the Express adapter.

## What Gets Generated vs Runtime

| Written to disk | Runtime only (in memory) |
|-----------------|--------------------------|
| `.fastbackend/ir.json` | REST routes (CRUD, relationships, custom) |
| `.fastbackend/openapi.yaml` | Validation (Pydantic or Zod) |
| | Query builders |

| You own | FastBackend never modifies |
|---------|---------------------------|
| `models.py` / `schema.prisma` | Schema files |
| `fastbackend.yaml` | Config |
| `app/custom/*` or `src/custom/*` | Custom endpoints |

## CLI Commands

| Command | Description |
|---------|-------------|
| `fastbackend init <name>` | Scaffold a new project |
| `fastbackend generate` | Parse schema, write IR + OpenAPI |
| `fastbackend dev` | Start runtime with optional `--watch` |
| `fastbackend build` | Production IR + OpenAPI generation |
| `fastbackend test` | Run framework tests |
| `fastbackend migrate` | Run database migrations |
| `fastbackend docker:build` | Build Docker image |

## Packages

Published on npm (public):

- [`@fastbackend/core`](https://www.npmjs.com/package/@fastbackend/core) - Schema parsing, IR generation, OpenAPI generation
- [`@fastbackend/cli`](https://www.npmjs.com/package/@fastbackend/cli) - Command-line interface
- [`@fastbackend/express`](https://www.npmjs.com/package/@fastbackend/express) - Express + Prisma runtime adapter

Python adapter (PyPI):

- `fastbackend-fastapi` - FastAPI runtime adapter

## Testing

```bash
pnpm test                  # TypeScript unit + E2E tests
pnpm test:coverage:python  # FastAPI adapter coverage (75% threshold)
pnpm test:integration:docker  # Docker build + /health (requires Docker)
pnpm test:all              # Run all of the above (use before release)
```

## Publishing

TypeScript packages use [Changesets](https://github.com/changesets/changesets):

```bash
pnpm changeset          # describe changes
pnpm run version        # bump versions and update changelogs
pnpm release            # build and publish to npm

# npm 2FA enabled:
pnpm release -- --otp=123456
```

All `@fastbackend/*` scoped packages publish with public access.

Before publishing, verify tarball contents:

```bash
pnpm --filter @fastbackend/core build
pnpm --filter @fastbackend/core pack
```

## Documentation

- **Docs site:** [fastbackend/apps/docs](./apps/docs/) - run with `cd apps/docs && npm install && npm run dev`
- **Guide (markdown):** [docs/GUIDE.md](./docs/GUIDE.md)

## Examples

| Example | Adapter | Schema |
|---------|---------|--------|
| [sqlalchemy-fastapi](./examples/sqlalchemy-fastapi/) | FastAPI | SQLAlchemy |
| [prisma-fastapi](./examples/prisma-fastapi/) | FastAPI | Prisma |
| [prisma-express](./examples/prisma-express/) | Express | Prisma |
