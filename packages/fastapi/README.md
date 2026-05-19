# @fastbackend/fastapi

FastAPI runtime adapter for the FastBackend framework. Reads IR from `.fastbackend/ir.json` and dynamically creates routes in memory at startup.

## Installation

```bash
pip install fastbackend-fastapi
```

## Usage

```python
from fastbackend_fastapi import create_app

app = create_app()
```

Then run with uvicorn:

```bash
uvicorn main:app --reload
```

Or use the CLI:

```bash
fastbackend generate  # Generate IR and OpenAPI
fastbackend dev       # Start development server
```

## Architecture

Routes exist **only in memory** (never written to disk). The runtime:

1. Loads IR from `.fastbackend/ir.json`
2. Dynamically creates CRUD endpoints for each entity
3. Dynamically creates relationship endpoints
4. Registers custom endpoints from `app/custom/`
5. Supports endpoint overrides via `@fastbackend.override()` markers

## Components

- `Runtime` - Orchestrates initialization
- `CRUDEngine` - Dynamic CRUD route creation
- `RelationshipEngine` - Dynamic relationship routes
- `ValidationEngine` - Dynamic Pydantic models
- `QueryEngine` - Pagination, filtering, sorting, search
