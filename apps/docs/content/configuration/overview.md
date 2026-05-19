---
title: Configuration
description: fastbackend.yaml reference for project, schema, adapter, and development settings.
---

# Configuration

Configuration lives in `fastbackend.yaml` at the project root.

## Full Example

```yaml
project:
  name: my-api
  version: 1.0.0
  description: My FastBackend API

schema:
  format: sqlalchemy          # sqlalchemy | prisma
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

## Prisma Schema

```yaml
schema:
  format: prisma
  path: schema.prisma
```

## Environment Variables

Use `${VAR_NAME}` syntax anywhere in the config. Missing variables raise a `ConfigValidationError`.

```yaml
adapter:
  options:
    databaseUrl: ${DATABASE_URL}
```

## Environment-Specific Config

Create `fastbackend.dev.yaml` or `fastbackend.prod.yaml` alongside the base config. Values merge over the base file.
