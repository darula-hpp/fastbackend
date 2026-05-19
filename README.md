# FastBackend

Schema-driven backend **runtime** that transforms database schemas into dynamic REST APIs with OpenAPI specifications.

## Quick Start

```bash
# Install dependencies (monorepo development)
cd fastbackend
pnpm install && pnpm build

# Create a project
node packages/cli/dist/index.js init my-api --schema sqlalchemy --adapter fastapi
cd my-api

# Install Python runtime
pip install -r requirements.txt

# Generate IR + OpenAPI from schema
fastbackend generate

# Start development server
fastbackend dev
```

## What Gets Generated vs Runtime

| Written to disk | Runtime only (in memory) |
|-----------------|--------------------------|
| `.fastbackend/ir.json` | FastAPI routes |
| `.fastbackend/openapi.yaml` | Pydantic models |
| | Query builders |

| You own | FastBackend never modifies |
|---------|---------------------------|
| `models.py` / `schema.prisma` | Schema files |
| `fastbackend.yaml` | Config |
| `app/custom/*.py` | Custom endpoints |

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

- `@fastbackend/core` - Schema parsing, IR generation, OpenAPI generation
- `@fastbackend/cli` - Command-line interface
- `fastbackend-fastapi` - Python FastAPI runtime adapter

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
pnpm version            # bump versions
pnpm release            # build and publish to npm
```

Published packages:

- `@fastbackend/core` and `@fastbackend/cli` on npm
- `fastbackend-fastapi` on PyPI (publish from `packages/fastapi` with `python -m build && twine upload dist/*`)

Before publishing, verify tarball contents:

```bash
pnpm --filter @fastbackend/core build
pnpm --filter @fastbackend/core pack
```

## Documentation

See [docs/GUIDE.md](./docs/GUIDE.md) for:

- IR reference and type definitions
- Configuration format and examples
- Custom endpoints and overrides
- Adding FastBackend to existing projects
- Troubleshooting

## Example

See [examples/sqlalchemy-fastapi](./examples/sqlalchemy-fastapi/) for SQLAlchemy, or [examples/prisma-fastapi](./examples/prisma-fastapi/) for Prisma.
