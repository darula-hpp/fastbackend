---
title: docker:build
description: Build a Docker image for the project.
---

# fastbackend docker:build

Build a Docker image using the project Dockerfile.

```bash
fastbackend docker:build [options]
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `-t, --tag <tag>` | `fastbackend-app:latest` | Image tag |
| `-f, --file <path>` | `Dockerfile` | Dockerfile path |

## Example

```bash
fastbackend generate
fastbackend docker:build -t my-api:latest
```

Run `fastbackend init --docker` to scaffold Dockerfile templates. Use `python -m uvicorn` in the Dockerfile CMD for multi-stage builds.
