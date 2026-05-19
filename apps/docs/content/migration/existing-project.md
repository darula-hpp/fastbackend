---
title: Existing Projects
description: Add FastBackend to an existing FastAPI application.
---

# Adding FastBackend to an Existing Project

1. Install packages:

   ```bash
   pip install fastbackend-fastapi
   npm install -g @fastbackend/cli
   ```

2. Create `fastbackend.yaml` pointing to your existing schema file.

3. Create `app/custom/` and move existing custom routes there.

4. Replace manual CRUD routes with the runtime:

   ```python
   from fastbackend_fastapi import create_app
   app = create_app()
   ```

5. Run `fastbackend generate` to produce IR and OpenAPI.

6. Remove hand-written CRUD route files that duplicate runtime behavior.

## Before vs After

| Before | After |
|--------|-------|
| Hand-written CRUD routers | Runtime creates routes from IR |
| Manual Pydantic schemas | Runtime creates models from IR |
| Manual OpenAPI annotations | Core generates OpenAPI from IR |
| Business logic endpoints | Keep in `app/custom/` |

Keep: schema definitions, custom business logic, database migrations, auth middleware.
