---
title: init
description: Scaffold a new FastBackend project.
---

# fastbackend init

Initialize a new FastBackend project.

```bash
fastbackend init <name> [options]
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--schema <format>` | `sqlalchemy` | Schema format: `sqlalchemy` or `prisma` |
| `--adapter <adapter>` | `fastapi` | Runtime adapter |
| `--docker` | off | Include Dockerfile and docker-compose templates |

## Example

```bash
fastbackend init my-api --schema sqlalchemy --adapter fastapi --docker
```

## Creates

```
my-api/
  models.py or schema.prisma
  fastbackend.yaml
  main.py
  app/custom/
  tests/
  requirements.txt
```
