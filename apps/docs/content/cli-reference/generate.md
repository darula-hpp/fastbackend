---
title: generate
description: Parse schema and write IR and OpenAPI to disk.
---

# fastbackend generate

Parse your schema and write IR and OpenAPI. Does **not** generate route code.

```bash
fastbackend generate [options]
```

## Options

| Flag | Description |
|------|-------------|
| `-c, --config <path>` | Path to `fastbackend.yaml` |
| `--debug` | Verbose logging |

## Output

- `.fastbackend/ir.json`
- `.fastbackend/openapi.yaml`

## Example

```bash
fastbackend generate
fastbackend generate --debug
```
