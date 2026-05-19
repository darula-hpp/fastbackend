---
title: Quick Start
description: Create a FastBackend project, generate IR, and start the dev server.
---

# Quick Start

## Published packages (recommended)

```bash
npm install -g @fastbackend/cli
pip install fastbackend-fastapi
```

### Create and run a FastAPI project

```bash
fastbackend init my-api --schema sqlalchemy --adapter fastapi
cd my-api
pip install -r requirements.txt
cp .env.example .env
fastbackend generate
fastbackend dev
```

Open [http://localhost:8301/docs](http://localhost:8301/docs) for interactive API docs.

### Try the example project

```bash
git clone https://github.com/darula-hpp/fastbackend.git
cd fastbackend/examples/sqlalchemy-fastapi
pip install -r requirements.txt
cp .env.example .env
fastbackend generate
fastbackend dev
```

## Try the API

```bash
curl http://localhost:8301/health
curl http://localhost:8301/users
curl -X POST http://localhost:8301/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'
```

## Monorepo development

If you are contributing to FastBackend itself:

```bash
cd fastbackend
pnpm install && pnpm build
alias fb='node packages/cli/dist/index.js'

fb init my-api --schema sqlalchemy --adapter fastapi
cd my-api
pip install -r requirements.txt
pip install -e ../packages/fastapi
fb generate
fb dev
```

## Express + Prisma

```bash
fastbackend init my-api --schema prisma --adapter express
cd my-api
npm install
cp .env.example .env
npx prisma migrate dev
fastbackend generate
fastbackend dev
```

See [Express Runtime Architecture](/docs/core-concepts/express-runtime-architecture) for details.
