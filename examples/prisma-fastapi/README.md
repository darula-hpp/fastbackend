# prisma-fastapi

Schema-driven backend powered by FastBackend using a Prisma schema.

## Setup

```bash
pip install -r requirements.txt
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

- `schema.prisma` - Prisma schema (you own this)
- `fastbackend.yaml` - Configuration
- `.fastbackend/` - Generated IR and OpenAPI (gitignored)
- `app/custom/` - Custom endpoints (you own this)
