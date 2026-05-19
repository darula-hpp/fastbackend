---
title: Overrides
description: Replace runtime CRUD routes with custom handlers.
---

# Overrides

Replace a runtime-created CRUD endpoint with custom logic using the `@override` decorator:

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

Supported methods: `get`, `post`, `put`, `delete`.
