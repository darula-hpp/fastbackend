---
title: Custom Endpoints
description: Add business logic endpoints in app/custom/.
---

# Custom Endpoints

Add files to `app/custom/` with a FastAPI router:

```python
# app/custom/email.py
from fastapi import APIRouter

router = APIRouter()

@router.post("/users/{user_id}/send-email")
async def send_email(user_id: int):
    """Send a notification email to the user."""
    return {"status": "sent", "user_id": user_id}
```

Custom endpoints are registered at runtime alongside generated routes. Re-run `fastbackend generate` to include them in OpenAPI.

See [examples/sqlalchemy-fastapi/app/custom/](https://github.com/darula-hpp/uigen/tree/main/fastbackend/examples/sqlalchemy-fastapi/app/custom) for working examples.
