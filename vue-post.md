# Reddit post draft: r/vuejs

**Subreddit:** [r/vuejs](https://reddit.com/r/vuejs) (also consider **r/Nuxt** for full-stack Vue)

**Pick one title** (avoid "I built" — emphasize **runtime**, not codegen):

1. **Schema-driven backend runtime — serves REST + OpenAPI for your Vue app** ← recommended
2. **Not codegen: a backend runtime that serves CRUD from your DB schema (OpenAPI for Vue)**
3. **Vue full-stack: backend runtime serves the API from schema, Orval types your frontend**
4. **SQLAlchemy/Prisma schema → live REST runtime → OpenAPI for typed Vue clients**
5. **Your DB schema runs as a REST API runtime — OpenAPI keeps Vue in sync**

**Avoid in titles:** "generate", "codegen", "scaffold" — FastBackend **serves routes at runtime** from IR; it does not dump route files you maintain.

**Avoid:** "I built...", "Introducing...", "Check out my..."

**Flair:** check sub rules — often **Showcase**, **Resource**, or **Discussion** depending on what's available

**Note:** r/webdev restricts some showcase posts to Saturday. r/vuejs is often more flexible, but read current rules before posting.

---

Building a Vue or Nuxt app usually means writing the frontend **and** maintaining a backend that stays in sync: CRUD routes, validation, OpenAPI docs, and typed client code on the Vue side. That sync work adds up fast.

**FastBackend** is an open-source **backend runtime** (not a codegen tool). Your database schema is the source of truth. The CLI compiles it to a framework-agnostic **IR**, the runtime **serves** REST routes in memory at startup, and OpenAPI is written alongside for your Vue app. You write custom backend code only for business logic.

This post is for Vue devs who want a **stable OpenAPI contract** and **typed clients** without maintaining both sides by hand.

## The Vue-side problem

Typical full-stack Vue flow:

1. Backend team (or you) defines models
2. Someone writes CRUD routes
3. OpenAPI drifts out of date
4. You hand-write `fetch` calls or types in Vue
5. Schema changes → repeat

FastBackend collapses the backend side (steps 2-3) and gives you a clean OpenAPI file for the Vue side (step 4).

## Backend in 4 commands

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

API runs at http://localhost:8301/ — Swagger docs at http://localhost:8301/docs

## Wire it into Vue with Orval

After `fastbackend generate`, you have `.fastbackend/openapi.yaml`.

Generate typed API clients for Vue:

```bash
npm install -D orval
```

`orval.config.ts`:

```typescript
import { defineConfig } from 'orval';

export default defineConfig({
  fastbackend: {
    input: '../backend/.fastbackend/openapi.yaml',
    output: {
      target: './src/api/generated.ts',
      client: 'vue-query',
      mode: 'tags-split',
    },
  },
});
```

```bash
npx orval
```

Use in a Vue component:

```vue
<script setup lang="ts">
import { useGetUsers } from '@/api/users';

const { data: users, isLoading } = useGetUsers();
</script>

<template>
  <ul v-if="users">
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
  <p v-else-if="isLoading">Loading...</p>
</template>
```

Orval also supports plain **axios** or **fetch** clients if you prefer composables without TanStack Query — same OpenAPI input.

## Nuxt

Same OpenAPI file works with Nuxt:

- Generate clients with Orval into `~/api/`
- Call from `useAsyncData` / `useFetch` in pages or server routes
- Proxy API calls in `nuxt.config` during dev if needed

The backend does not need to know about Nuxt. OpenAPI is the contract.

## How the backend side works

```
Schema (SQLAlchemy or Prisma)
        ↓
   fastbackend generate
        ↓
.fastbackend/ir.json + openapi.yaml   ← Vue reads this
        ↓
   fastbackend dev
        ↓
   REST API + /docs
```

**The IR is framework-agnostic** on the backend (FastAPI or Express adapters today).

**OpenAPI is framework-agnostic** on the frontend — Vue, Nuxt, React, Svelte all consume the same spec.

## Custom backend logic (when CRUD is not enough)

Overrides and custom routes for the 10% that is actually custom:

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

Regenerate OpenAPI after backend changes, re-run Orval, Vue types stay in sync.

## What's supported today

| Adapter | Stack | Schema |
|---------|-------|--------|
| FastAPI | Python | SQLAlchemy, Prisma |
| Express | Node/TS | Prisma |

Published:

- npm: `@fastbackend/cli`, `@fastbackend/core`, `@fastbackend/express`
- PyPI: `fastbackend-fastapi`

## Honest limits

- FastBackend is the **backend** — it does not generate Vue components
- FastAPI adapter uses an **in-memory store** for the MVP (data resets on restart)
- Express + Prisma is more production-shaped
- Self-hosted OSS, not a hosted BaaS like Supabase

## Where this is going (not shipped yet)

Declarative config for storage, OAuth, etc. — provider + URLs in `fastbackend.yaml`, secrets in `.env`. Same idea: less boilerplate, custom code when you need it.

## Links

- GitHub: https://github.com/darula-hpp/fastbackend
- npm CLI: https://www.npmjs.com/package/@fastbackend/cli
- Example: https://github.com/darula-hpp/fastbackend/tree/main/examples/sqlalchemy-fastapi
- Orval (Vue client codegen): https://orval.dev/

Would love feedback from Vue/Nuxt devs — especially how you handle OpenAPI → typed clients today, and what would make this workflow smoother.

---

## Other Reddit communities (post anytime vs Saturday)

| Subreddit | Fit | When / notes |
|-----------|-----|----------------|
| **r/vuejs** | Strong — this post | Any day (check flair/rules) |
| **r/Nuxt** | Strong — full-stack Vue | Cross-post Nuxt-flavored version |
| **r/FastAPI** | Strongest backend fit | Any day, lead with Python/FastAPI |
| **r/Python** | Good — SQLAlchemy angle | Any day, practical demo |
| **r/node** | Good — Express + Prisma adapter | Any day |
| **r/typescript** | OK — Express adapter, IR | Any day |
| **r/SideProject** | Good — early OSS feedback | Any day, casual tone |
| **r/opensource** | OK — OSS launch | Any day |
| **r/selfhosted** | OK — Docker/self-hosted angle | Emphasize self-hosted, not BaaS |
| **r/webdev** | Good | **Showoff Saturday only** for showcase posts |
| **r/programming** | Harder — broad, competitive | Only with strong demo |
| **r/sveltejs** | Good — tailor like this post | Create `svelte-post.md` similarly |

**Suggested order:** r/vuejs → r/FastAPI → r/Python → r/webdev (Saturday) → Show HN

---

## Posting notes (for you, not Reddit)

- **Lead with Vue pain** (typed clients, sync), not "new backend framework"
- **Include:** screen recording of Orval generating clients + Vue component consuming `/users`
- **Engage:** ask how people handle OpenAPI in Vue today (Orval vs openapi-typescript vs manual)
- **Comparison:** "Supabase gives you hosted API + auth. FastBackend gives you schema → OpenAPI on your own infra — Vue consumes the spec."
- **Cross-post r/Nuxt:** swap "Vue" → "Nuxt", mention `useAsyncData` / server routes
