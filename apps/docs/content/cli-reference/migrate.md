---
title: migrate
description: Run database migrations for the project.
---

# fastbackend migrate

Run database migrations. Adapter-specific behavior applies.

```bash
fastbackend migrate
```

For SQLAlchemy projects, integrate Alembic in your project. For Prisma, use `prisma migrate`. FastBackend does not replace your migration tool.
