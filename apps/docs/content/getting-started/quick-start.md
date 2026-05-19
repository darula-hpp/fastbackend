---
title: Quick Start
description: Create a FastBackend project, generate IR, and start the dev server.
---

# Quick Start

## 1. Build FastBackend (monorepo dev)

```bash
cd fastbackend
pnpm install && pnpm build
```

## 2. Install the Python runtime

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e "packages/fastapi[dev]"
```

## 3. Create a project

```bash
alias fb='node packages/cli/dist/index.js'

fb init my-api --schema sqlalchemy --adapter fastapi
cd my-api
pip install -r requirements.txt
pip install -e ../packages/fastapi   # local dev until PyPI publish
```

## 4. Generate and run

```bash
fb generate
fb dev
```

## 5. Try the API

```bash
curl http://localhost:8000/health
curl http://localhost:8000/users
curl -X POST http://localhost:8000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}'
```

Open [http://localhost:8000/docs](http://localhost:8000/docs) for interactive API docs.

## Use the Example Project

```bash
cd fastbackend/examples/sqlalchemy-fastapi
fb generate
fb dev
```
