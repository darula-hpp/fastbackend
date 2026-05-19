---
title: Common Issues
description: Troubleshooting schema parsing, IR, config, runtime, and Docker errors.
---

# Common Issues

## Schema Parsing

**`Schema parsing failed in sqlalchemy`**

- Verify Python 3.10+: `python3 --version`
- Install SQLAlchemy: `pip install sqlalchemy`
- Ensure `DeclarativeBase` and `__tablename__` are set

**`No SQLAlchemy Base class found`**

- Define a `Base` class inheriting from `DeclarativeBase`

## IR Validation

**`IR validation failed`**

- Check `.fastbackend/ir.invalid.json` for the partial IR
- Ensure all entities have fields and a primary key

## Configuration

**`Environment variable X is not defined`**

- Export the variable or remove `${X}` from config

**`Invalid configuration at schema.format`**

- Supported: `sqlalchemy`, `prisma`

## Runtime

**`IR file not found`**

- Run `fastbackend generate` before `fastbackend dev`

**`Failed to initialize runtime`**

- Validate `.fastbackend/ir.json` is valid JSON
- Run with `--debug`: `fastbackend dev --debug`

**`email-validator is not installed`**

- `pip install 'pydantic[email]'`

## Docker

**`Dockerfile not found`**

- Run `fastbackend init --docker`

**Container exits immediately**

- Use `python -m uvicorn main:app` in Dockerfile CMD
- Run `fastbackend generate` before `docker build`

## Debug Mode

```bash
fastbackend generate --debug
fastbackend dev --debug
```
