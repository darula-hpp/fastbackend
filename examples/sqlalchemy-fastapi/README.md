# my-api

Schema-driven backend powered by FastBackend.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
npm install -g @fastbackend/cli
```

## Usage

```bash
# Generate IR and OpenAPI from schema
fastbackend generate

# Start development server
fastbackend dev
```

## Project Structure

- `models.py` - SQLAlchemy schema (you own this)
- `fastbackend.yaml` - Configuration
- `.fastbackend/` - Generated IR and OpenAPI (gitignored)
- `app/custom/` - Custom endpoints and overrides (you own this)

## Custom Endpoints

Add new routes under `app/custom/` with a FastAPI `APIRouter`:

- `email.py` - `POST /users/{user_id}/send-email`
- `health.py` - `GET /health/custom`

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
    return {"id": user_id, "name": "Override User", "source": "custom-override"}
```

The runtime scans override markers at startup, skips the default route, and mounts your handler instead. Try it:

```bash
fastbackend dev
curl http://localhost:8000/users/1
```

## Tests

```bash
pytest tests/ -v
```
