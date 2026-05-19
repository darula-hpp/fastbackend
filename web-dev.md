# Reddit post draft: r/webdev

**Pick one title** (avoid "I built" — those tend to flop on r/webdev):

### Vision / runtime-first
1. **Schema-driven backend runtime — serves REST + OpenAPI from your DB schema** ← recommended
2. **Not codegen: backend runtime that serves CRUD from schema, OpenAPI for any frontend**
3. **~90% of backend work is boilerplate. FastBackend runs it as a runtime from your schema.**
4. **Schema → IR → runtime adapter → live REST + OpenAPI**

### Pain point / problem-first
5. **Stop hand-writing CRUD routes — serve them at runtime from your DB schema instead**
6. **Stop writing the same CRUD routes — your DB schema can run as the API**
7. **What if your database schema was a live API runtime, not just models?**

### Schema / stack-specific
8. **SQLAlchemy/Prisma schema → REST runtime (FastAPI or Express) + OpenAPI**
9. **Schema → runtime → OpenAPI → typed frontend client. One pipeline.**

### Showcase flair (if sub requires it)
10. **Showcase: FastBackend — schema-first backend runtime with overrides**

**Avoid in titles:** "generate", "codegen" — FastBackend **serves routes at runtime** from IR; it does not dump route files you maintain.

**Avoid:** "I built...", "Introducing...", "My new project...", "Check out my..."

**Flair:** Showcase / Open Source (pick what the sub allows)

---

Most backend work is repetitive. Once you have a schema, a huge share of any API is predictable: CRUD, relationships, validation, filtering, OpenAPI docs. That is roughly **90% of most backends**.

The other **10%** is what actually differentiates your product: custom business logic, integrations, auth flows, microservices, and one-off endpoints.

**FastBackend** is an open-source **backend runtime** (not a codegen tool). Your database schema is the source of truth. The CLI compiles it to a framework-agnostic **IR**, a runtime adapter **serves** REST + OpenAPI at startup, and you write custom code only where it matters.

## The problem

Most side projects and MVPs stall here:

1. Define models
2. Write the same list/create/read/update/delete routes
3. Keep OpenAPI in sync manually
4. Generate typed clients for the frontend
5. Repeat every time the schema changes

FastBackend collapses steps 2-4. You focus on the 10% that is actually custom.

## How it works today

```
Schema (SQLAlchemy or Prisma)
        ↓
   fastbackend generate
        ↓
.fastbackend/ir.json + openapi.yaml
        ↓
   fastbackend dev  (or uvicorn/Docker in prod)
        ↓
   REST API + /docs
```

**The IR is the key.** It is not tied to FastAPI or Express. The same schema can be served by different backend adapters. The OpenAPI output is not tied to React or Vue — any frontend can consume it.

You still own:

- Your schema file (`models.py` or `schema.prisma`)
- Custom routes and overrides (`app/custom/` for FastAPI, `src/custom/` for Express)
- `fastbackend.yaml` config

## Quick start (Python / FastAPI)

```bash
npm install -g @fastbackend/cli

git clone https://github.com/darula-hpp/fastbackend.git
cd fastbackend/examples/sqlalchemy-fastapi

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
fastbackend generate
fastbackend dev
```

Then open:

- API overview: http://localhost:8301/
- Swagger docs: http://localhost:8301/docs
- Health: http://localhost:8301/health

## Why frontend devs should care

The output is a standard **OpenAPI spec** at `.fastbackend/openapi.yaml`.

That means you can plug it into whatever frontend stack you use:

- **React / Vue / Svelte / Angular**: Orval, openapi-typescript, Hey API, etc.
- **UIGen** (my other project): auto-generates a React admin UI from the same OpenAPI file

```bash
# backend
fastbackend generate

# frontend client codegen (pick your tool)
npx orval --input .fastbackend/openapi.yaml --output ./src/api

# or full React UI from the same spec
npx @uigen-dev/cli serve .fastbackend/openapi.yaml
```

OpenAPI is the handoff point. You are not locked into one UI framework.

## Custom code for the 10%

Generated routes cover the boring stuff. Overrides and custom routes cover business logic.

**Custom route** (new endpoint):

```python
# app/custom/email.py
from fastapi import APIRouter

router = APIRouter()

@router.post("/users/{user_id}/send-email")
async def send_email(user_id: int):
    return {"status": "sent", "user_id": user_id}
```

**Override** (replace a generated route):

```python
from fastapi import APIRouter
from fastbackend_fastapi import override

router = APIRouter()

@override("/users/{id}", "get")
@router.get("/users/{user_id}")
async def custom_get_user(user_id: int):
    return {"id": user_id, "name": "Override User", "source": "custom-override"}
```

The runtime discovers these at startup and merges them into the served API + OpenAPI output.

## What's supported today

| Adapter | Stack | Schema |
|---------|-------|--------|
| FastAPI | Python | SQLAlchemy, Prisma |
| Express | Node/TS | Prisma |

Published packages:

- npm: `@fastbackend/cli`, `@fastbackend/core`, `@fastbackend/express`
- PyPI: `fastbackend-fastapi`

| Command | Purpose |
|---------|---------|
| `fastbackend init` | Scaffold a new project |
| `fastbackend generate` | Schema → IR + OpenAPI |
| `fastbackend dev` | Local dev server (hot reload) |
| `fastbackend build` | Production IR + OpenAPI (CI/deploy) |
| `fastbackend test` | Run project tests |
| `fastbackend migrate` | DB migrations (adapter-specific) |
| `fastbackend docker:build` | Build Docker image |

Prod today: `fastbackend build` + run uvicorn/Docker (no `fastbackend start` yet).

## Where this is going (not shipped yet)

Same philosophy for common backend services: **declare the provider and URLs in config, keep secrets in `.env`**, runtime wires the integration.

Future `fastbackend.yaml` might look like:

```yaml
services:
  storage:
    provider: s3
    bucket: ${S3_BUCKET}
    region: ${AWS_REGION}

  oauth:
    providers:
      - name: google
        clientId: ${GOOGLE_CLIENT_ID}
        clientSecret: ${GOOGLE_CLIENT_SECRET}
```

Pluggable service providers (storage, OAuth, email, webhooks) — same escape hatch as CRUD: declarative by default, custom code when you need it. Self-hosted: you bring credentials, FastBackend wires the boilerplate.

This is the direction, not the current release. Today is schema → IR → REST + OpenAPI.

## Honest limits

- FastAPI adapter uses an **in-memory store** for the MVP (data resets on restart)
- Express adapter uses Prisma + Postgres (more production-shaped)
- Early OSS, not a hosted platform like Supabase

I'm sharing it because the **schema → OpenAPI → any frontend** workflow is useful across stacks, and I'd love feedback from people building full-stack apps.

## Links

- GitHub: https://github.com/darula-hpp/fastbackend
- npm CLI: https://www.npmjs.com/package/@fastbackend/cli
- PyPI runtime: https://pypi.org/project/fastbackend-fastapi/
- Example: https://github.com/darula-hpp/fastbackend/tree/main/examples/sqlalchemy-fastapi

Happy to answer questions about the IR pipeline, overrides, OpenAPI output, or how you'd wire this into Vue/Svelte/React.

---

## Posting notes (for you, not Reddit)

- **Best time:** weekday morning US/EU overlap
- **Include:** 30-60s screen recording of `generate` → `dev` → `/docs` → one custom override
- **Do not:** cross-post identical text to r/vuejs or r/sveltejs without tailoring the frontend section
- **Engage:** reply quickly to comments about Supabase/FastAPI-CRUD/Django REST comparisons
- **Comparison one-liner:** "Supabase is hosted infra + auth + DB. FastBackend is a self-hosted codegen runtime: schema → IR → REST + OpenAPI. Declarative service wiring (storage, OAuth) is on the roadmap."
- **If asked about roadmap:** emphasize pluggable providers, secrets in env, custom code for edge cases — not "replacing all backend code"
