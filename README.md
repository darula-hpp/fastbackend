# FastBackend

FastBackend automates the repetitive ~90% of backend work: CRUD, relationships, validation, filtering, and OpenAPI from your database schema. Your schema compiles to a framework-agnostic **IR**, a **runtime adapter** (FastAPI or Express) serves REST routes in memory, and OpenAPI on disk is the contract for any frontend.

## Demo

<video src="examples/output.mp4" controls width="100%"></video>

## Vision

Most backend work is predictable once you have a schema. FastBackend handles that layer so you can focus on business logic: overrides, custom routes, integrations, and one-off endpoints.

| Adapter | Stack | Persistence | Best for |
|---------|-------|-------------|----------|
| **FastAPI** | Python | In-memory (MVP) | SQLAlchemy or Prisma schema, Python teams |
| **Express** | TypeScript | Prisma Client | Prisma schema, Node/TypeScript teams |

`@fastbackend/core` and `@fastbackend/cli` are adapter-agnostic. Custom code lives in `app/custom/` (Python) or `src/custom/` (Express).

## How It Works

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

1. **`fastbackend generate`** parses your schema into IR and writes `.fastbackend/ir.json` plus `.fastbackend/openapi.yaml`.
2. **`fastbackend dev`** loads IR, registers CRUD and relationship routes, applies validation (Pydantic or Zod), and mounts custom endpoints.
3. FastAPI uses an in-memory store today; Express uses Prisma Client against your database.

## Frontend Integration

`fastbackend generate` writes `.fastbackend/openapi.yaml`. **[UIGen](https://github.com/darula-hpp/uigen)** has first-class support: it renders a complete frontend from that spec at runtime, with overrides for custom views when you need them.

```bash
fastbackend generate
fastbackend dev   # API at http://localhost:8301

npx @uigen-dev/cli@latest init my-app --spec .fastbackend/openapi.yaml
npx @uigen-dev/cli@latest serve openapi.yaml --proxy-base http://localhost:8301
```

OpenAPI is the contract between backend and frontend. You can also use Orval, openapi-typescript, Hey API, or your own tooling if you prefer typed clients only.

## Custom Routes and Overrides

Generated routes cover CRUD and relationships. For everything else:

- **Custom route**: add a new endpoint under `app/custom/` or `src/custom/`
- **Override**: replace a generated route (e.g. custom `GET /users/{id}` handler)

The runtime discovers these at startup and merges them into the served API and OpenAPI output. See [examples/sqlalchemy-fastapi](./examples/sqlalchemy-fastapi/) for override examples.

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

## Roadmap

Same philosophy for common backend services: **declare the provider and URLs in config, keep secrets in `.env`**, runtime wires the integration.

Planned (not shipped yet):

- **Storage** (S3, etc.): declarative bucket/region config, credentials in env
- **OAuth**: declarative provider config, client secrets in env
- **More runtime adapters**: same IR pipeline, different backend frameworks

Self-hosted: you bring credentials, FastBackend wires the boilerplate. Custom code remains the escape hatch when declarative config is not enough.

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

Python adapter ([PyPI](https://pypi.org/project/fastbackend-fastapi/)):

- [`fastbackend-fastapi`](https://pypi.org/project/fastbackend-fastapi/) - FastAPI runtime adapter

## Testing

```bash
pnpm test                  # TypeScript unit + E2E tests
pnpm test:coverage:python  # FastAPI adapter coverage (75% threshold)
pnpm test:integration:docker  # Docker build + /health (requires Docker)
pnpm test:all              # Run all of the above
```

## Documentation

- **Docs site:** [fastbackend/apps/docs](./apps/docs/) - run with `cd apps/docs && npm install && npm run dev`
- **Guide (markdown):** [docs/GUIDE.md](./docs/GUIDE.md)

## Examples

| Example | Adapter | Schema | Port |
|---------|---------|--------|------|
| [sqlalchemy-fastapi](./examples/sqlalchemy-fastapi/) | FastAPI | SQLAlchemy | 8301 |
| [prisma-fastapi](./examples/prisma-fastapi/) | FastAPI | Prisma | 8301 |
| [prisma-express](./examples/prisma-express/) | Express | Prisma | 3001 |

Each example has its own README with endpoints, overrides, and tests. From the repo root, build the CLI once:

```bash
cd fastbackend
pnpm install && pnpm build
```

Use `node packages/cli/dist/index.js` instead of `fastbackend` below if you have not installed the CLI globally.

### Run the FastAPI example (Python)

```bash
cd fastbackend/examples/sqlalchemy-fastapi
pip install -r requirements.txt
cp .env.example .env
fastbackend generate
fastbackend dev
```

Open http://localhost:8301/ for the API overview. See [examples/sqlalchemy-fastapi/README.md](./examples/sqlalchemy-fastapi/README.md) for custom endpoints, overrides, and tests.

### Run the Express example (TypeScript + Prisma)

Requires PostgreSQL. Start a local database (Docker example):

```bash
docker run -d --name fb-prisma-express \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=prisma_express \
  -p 5432:5432 postgres:16
```

Then run the app:

```bash
cd fastbackend/examples/prisma-express
npm install
cp .env.example .env
npx prisma migrate dev
fastbackend generate
fastbackend dev
```

Open http://localhost:3001/ for the API overview. See [examples/prisma-express/README.md](./examples/prisma-express/README.md) for details.

The CLI loads `.env` automatically for `dev`, `generate`, `migrate`, and `test`. Copy from `.env.example` once per project; see each example README for the variables it uses.
