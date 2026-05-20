# sqlalchemy-fastapi

SQLAlchemy + FastAPI example for FastBackend. The runtime reads IR from `.fastbackend/ir.json`, registers CRUD and relationship routes in memory, and mounts your custom handlers from `app/custom/`.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
npm install -g @fastbackend/cli
```

From the monorepo, use the local CLI instead:

```bash
cd fastbackend
pnpm install && pnpm build
# then in this example:
node ../../packages/cli/dist/index.js generate
node ../../packages/cli/dist/index.js dev
```

## Environment

Copy `.env.example` to `.env`. The CLI loads it automatically for `dev`, `generate`, `migrate`, and `test`.

| Variable | Default | Used by |
|----------|---------|---------|
| `PORT` | `8301` | Optional server port (also set in `fastbackend.yaml`) |

## Usage

```bash
fastbackend generate   # schema -> IR + OpenAPI on disk
fastbackend dev        # start FastAPI runtime (port 8301)
```

## API Endpoints

| URL | Description |
|-----|-------------|
| `GET /` | API overview and resource list |
| `GET /health` | Health check |
| `GET /users` | List users |
| `POST /users` | Create user |
| `GET /users/{id}` | **Overridden** by `app/custom/users_override.py` |
| `GET /posts` | List posts |
| `POST /users/{user_id}/send-email` | Custom endpoint (`app/custom/email.py`) |
| `GET /health/custom` | Custom health extension (`app/custom/health.py`) |

Try it:

```bash
curl http://localhost:8301/
curl http://localhost:8301/health
curl http://localhost:8301/users/1
```

Expected override response:

```json
{
  "id": 1,
  "name": "Override User",
  "email": "override@example.com",
  "source": "custom-override"
}
```

## Project Structure

```
sqlalchemy-fastapi/
  models.py              # SQLAlchemy schema (you own this)
  main.py                # FastAPI entry point
  fastbackend.yaml       # Project config
  .env.example           # Local env template
  .fastbackend/          # Generated IR + OpenAPI (gitignored)
  app/custom/            # Custom endpoints and overrides (you own this)
  tests/                 # pytest suite
```

## Custom Endpoints

Add new routes under `app/custom/` with a FastAPI `APIRouter`:

```python
# app/custom/email.py
from fastapi import APIRouter

router = APIRouter()

@router.post("/users/{user_id}/send-email")
async def send_email(user_id: int):
    return {"status": "sent", "user_id": user_id}
```

Export `router` from each file. The runtime imports and mounts them at startup.

## Override Example

Replace a generated CRUD route with your own handler using `@fastbackend.override()`:

```python
# app/custom/users_override.py
from fastapi import APIRouter
from fastbackend_fastapi import override

router = APIRouter()

@override("/users/{id}", "get")
@router.get("/users/{user_id}")
async def custom_get_user(user_id: int):
    return {
        "id": user_id,
        "name": "Override User",
        "email": "override@example.com",
        "source": "custom-override",
    }
```

The runtime scans override markers at startup, skips the default route for that method/path, and mounts your handler instead.

## Tests

```bash
pytest tests/ -v
```

Includes override coverage in `tests/test_overrides.py`.

## Notes

- **Persistence:** FastAPI adapter uses an in-memory store (MVP). Data resets when the server restarts.
- **OpenAPI:** Written to `.fastbackend/openapi.yaml` after `fastbackend generate`. Use with [UIGen](https://github.com/darula-hpp/uigen) for a complete frontend, or with Orval and other OpenAPI tooling for typed clients.
