---
title: Testing
description: Project tests and monorepo test commands.
---

# Testing

## Project Tests

Scaffolded projects include:

```
tests/
  conftest.py
  test_health.py
  test_custom_endpoints.py
```

Run with:

```bash
fastbackend test
pytest tests/ -v
```

## Monorepo Tests

From the `fastbackend/` root:

```bash
pnpm test                  # TypeScript unit + E2E
pnpm test:coverage:python  # FastAPI adapter (75% threshold)
pnpm test:integration:docker  # Docker build + /health
pnpm test:all              # All of the above
```
