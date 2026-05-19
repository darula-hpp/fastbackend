---
title: dev
description: Start the development server with optional watch mode.
---

# fastbackend dev

Start the FastAPI development server. Runs `generate` first if IR is missing.

```bash
fastbackend dev [options]
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--watch` | from config | Watch schema and config for changes |
| `--port <port>` | `8000` | Server port |
| `--debug` | off | Verbose logging |

## Example

```bash
fastbackend dev
fastbackend dev --watch --port 8000
```

Uses uvicorn with hot reload when `development.hotReload` is enabled in config.
