---
title: test
description: Run project tests with pytest.
---

# fastbackend test

Run framework-specific tests for the current project.

```bash
fastbackend test [options]
```

## Options

| Flag | Description |
|------|-------------|
| `--adapter <adapter>` | Override adapter from config |

## Example

```bash
fastbackend test
pytest tests/ -v
```

Scaffolded projects include `tests/conftest.py`, `test_health.py`, and `test_custom_endpoints.py`.
