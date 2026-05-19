# FastBackend Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [IR Reference](#ir-reference)
3. [Configuration](#configuration)
4. [Custom Endpoints and Overrides](#custom-endpoints-and-overrides)
5. [Migration Guide](#migration-guide)
6. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- Node.js 20+ and pnpm (for CLI and core)
- Python 3.10+ (for FastAPI adapter)
- SQLAlchemy or Prisma schema

### Installation

**Global CLI (when published):**

```bash
npm install -g @fastbackend/cli
```

**Monorepo development:**

```bash
cd fastbackend
pnpm install && pnpm build
```

**Python runtime:**

```bash
pip install fastbackend-fastapi
```

### Initialize a Project

```bash
fastbackend init my-api --schema sqlalchemy --adapter fastapi

# With Docker templates
fastbackend init my-api --schema sqlalchemy --adapter fastapi --docker
```

This creates:

```
my-api/
  models.py           # Your SQLAlchemy schema
  fastbackend.yaml    # Configuration
  main.py             # FastAPI entry point
  app/custom/         # Your custom endpoints
  .fastbackend/       # Generated (gitignored)
    ir.json
    openapi.yaml
```

### Define Your Schema

```python
# models.py
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, DeclarativeBase

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    posts = relationship("Post", back_populates="author")

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    author = relationship("User", back_populates="posts")
```

### Generate and Run

```bash
fastbackend generate   # Writes IR + OpenAPI (no route code)
fastbackend dev        # Starts runtime, creates routes in memory
```

The runtime reads `.fastbackend/ir.json` and dynamically registers CRUD routes, relationship routes, and your custom endpoints.

---

## IR Reference

The Intermediate Representation (IR) is JSON stored at `.fastbackend/ir.json`. It is the contract between core and runtime adapters.

### Root Structure

```json
{
  "version": "1.0.0",
  "metadata": {
    "projectName": "my-api",
    "schemaFormat": "sqlalchemy",
    "adapter": "fastapi",
    "generatedAt": "2026-05-19T09:26:21.902Z",
    "schemaVersion": "1.0.0"
  },
  "entities": [],
  "relationships": [],
  "enums": []
}
```

### Entity (`IREntity`)

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | PascalCase entity name (e.g. `User`) |
| `tableName` | string | Database table name (e.g. `users`) |
| `fields` | IRField[] | Column definitions |
| `primaryKey` | string[] | Primary key field names |
| `uniqueConstraints` | string[][] | Unique constraint field groups |
| `indexes` | IRIndex[] | Database indexes |
| `metadata` | object | Tags, descriptions, UIGen annotations |

### Field (`IRField`)

```json
{
  "name": "email",
  "type": { "base": "string", "format": "email" },
  "nullable": false,
  "defaultValue": null,
  "validation": [{ "type": "required" }, { "type": "email" }],
  "metadata": { "description": "User email address" }
}
```

**Field type bases:** `string`, `integer`, `float`, `boolean`, `date`, `datetime`, `json`, `enum`, `array`

**Formats:** `email`, `uuid`, `url`

### Relationship (`IRRelationship`)

```json
{
  "name": "posts",
  "type": "one-to-many",
  "sourceEntity": "User",
  "targetEntity": "Post",
  "sourceField": "id",
  "targetField": "user_id",
  "cascadeDelete": false,
  "metadata": { "backPopulates": "author" }
}
```

**Types:** `one-to-one`, `one-to-many`, `many-to-one`, `many-to-many`

### Enum (`IREnum`)

```json
{
  "name": "UserRole",
  "values": [
    { "name": "ADMIN", "value": "ADMIN" },
    { "name": "USER", "value": "USER" }
  ],
  "metadata": {}
}
```

### Validation Rules

| Type | Description |
|------|-------------|
| `required` | Field must be present |
| `min` / `max` | Numeric bounds |
| `minLength` / `maxLength` | String length |
| `pattern` | Regex pattern |
| `email` / `url` / `uuid` | Format validation |

---

## Configuration

Configuration lives in `fastbackend.yaml` at the project root.

### Full Example

```yaml
project:
  name: my-api
  version: 1.0.0
  description: My FastBackend API

schema:
  format: sqlalchemy          # sqlalchemy | prisma | jpa
  path: models.py
  include: []
  exclude: []

adapter:
  name: fastapi               # fastapi | spring | express
  customPath: app/custom
  options: {}

openapi:
  outputPath: .fastbackend/openapi.yaml
  title: My API
  version: 1.0.0
  servers:
    - url: http://localhost:8301
      description: Development
  annotations:
    relationships: true

development:
  watch: true
  port: 8301
  hotReload: true
```

### Environment Variables

Use `${VAR_NAME}` syntax anywhere in the config:

```yaml
adapter:
  options:
    databaseUrl: ${DATABASE_URL}
```

Missing variables raise a `ConfigValidationError` with the variable name.

### Environment-Specific Config

Create `fastbackend.dev.yaml` or `fastbackend.prod.yaml` alongside the base config. Values are merged over the base file.

### Prisma Schema

```yaml
schema:
  format: prisma
  path: prisma/schema.prisma
```

### Adapter Options (FastAPI)

| Option | Description |
|--------|-------------|
| `customPath` | Directory for custom endpoints (default: `app/custom`) |

---

## Custom Endpoints and Overrides

### Custom Endpoints

Add files to `app/custom/`:

```python
# app/custom/email.py
from fastapi import APIRouter

router = APIRouter()

@router.post("/users/{user_id}/send-email")
async def send_email(user_id: int):
    """Send a notification email to the user."""
    return {"status": "sent", "user_id": user_id}
```

Custom endpoints are registered at runtime alongside generated routes. Re-run `fastbackend generate` to include them in OpenAPI.

See `examples/sqlalchemy-fastapi/app/custom/` for working examples. A Prisma-based example lives in `examples/prisma-fastapi/`.

### Override Runtime Routes

Replace a runtime-created CRUD endpoint with custom logic:

```python
# app/custom/users_override.py
from fastapi import APIRouter
from fastbackend_fastapi import override

router = APIRouter()

@override("/users", "get")
@router.get("/users")
async def custom_list_users():
    return [{"id": 1, "email": "custom@example.com"}]
```

When an endpoint is overridden:
- The runtime skips creating the default route
- OpenAPI marks the path with `x-fastbackend-override: true`

---

## Migration Guide

### Adding FastBackend to an Existing FastAPI Project

1. Install packages:
   ```bash
   pip install fastbackend-fastapi
   npm install -g @fastbackend/cli
   ```

2. Create `fastbackend.yaml` pointing to your existing schema file.

3. Create `app/custom/` and move existing custom routes there.

4. Replace manual CRUD routes in your app with the runtime:
   ```python
   # main.py
   from fastbackend_fastapi import create_app
   app = create_app()
   ```

5. Run `fastbackend generate` to produce IR and OpenAPI.

6. Remove hand-written CRUD route files that duplicate runtime behavior.

### Migrating from Manual API Code

| Before | After |
|--------|-------|
| Hand-written CRUD routers | Runtime creates routes from IR |
| Manual Pydantic schemas | Runtime creates models from IR |
| Manual OpenAPI annotations | Core generates OpenAPI from IR |
| Business logic endpoints | Keep in `app/custom/` |

Keep these files:
- Schema definitions (`models.py`, `schema.prisma`)
- Custom business logic (`app/custom/`)
- Database migrations (Alembic, Prisma migrate)
- Authentication middleware (add via FastAPI dependencies)

---

## Testing

FastBackend scaffolds pytest fixtures when you run `fastbackend init`:

```
tests/
  conftest.py           # Shared TestClient fixture
  test_health.py        # Runtime health endpoints
  test_custom_endpoints.py
```

Run tests with:

```bash
fastbackend test
# or
pytest tests/ -v
```

Monorepo coverage:

```bash
pnpm test:coverage         # @fastbackend/core (80% threshold)
pnpm test:coverage:python  # fastbackend-fastapi (75% threshold)
```

### Schema Parsing Errors

**Error:** `Schema parsing failed in sqlalchemy`

- Verify Python 3.10+ is installed: `python3 --version`
- Install SQLAlchemy: `pip install sqlalchemy`
- Check model syntax: ensure `DeclarativeBase` and `__tablename__` are set
- Run parser directly:
  ```bash
  python3 packages/core/src/parsers/sqlalchemy/parser.py models.py
  ```

**Error:** `No SQLAlchemy Base class found`

- Define a `Base` class inheriting from `DeclarativeBase`

### IR Validation Errors

**Error:** `IR validation failed`

- Check `.fastbackend/ir.invalid.json` for the partial IR
- Ensure all entities have at least one field and a primary key

### Configuration Errors

**Error:** `Environment variable X is not defined`

- Export the variable: `export DATABASE_URL=postgresql://...`
- Or remove `${X}` from config and use a literal value

**Error:** `Invalid configuration at schema.format`

- Supported formats: `sqlalchemy`, `prisma`

### Runtime Errors

**Error:** `IR file not found`

- Run `fastbackend generate` before `fastbackend dev`

**Error:** `Failed to initialize runtime`

- Validate IR: check `.fastbackend/ir.json` is valid JSON
- Enable debug logging: `fastbackend dev --debug`

**Error:** `email-validator is not installed`

- Install: `pip install 'pydantic[email]'`

### Docker

**Error:** `Dockerfile not found`

- Run `fastbackend init --docker` or create a Dockerfile manually

### Debug Mode

```bash
fastbackend generate --debug
fastbackend dev --debug
```

Shows verbose logging for schema parsing, IR generation, and route registration.

### Getting Help

- Check generated files: `.fastbackend/ir.json` and `.fastbackend/openapi.yaml`
- Run tests: `pnpm test` (TypeScript) or `pytest` (Python)
- Example projects: `examples/sqlalchemy-fastapi/`, `examples/prisma-fastapi/`

### Publishing

**npm (`@fastbackend/core`, `@fastbackend/cli`):**

```bash
cd fastbackend
pnpm changeset && pnpm version && pnpm release
```

**PyPI (`fastbackend-fastapi`):**

```bash
cd packages/fastapi
python -m pip install build twine
python -m build
twine upload dist/*
```
