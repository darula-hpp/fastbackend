# my-api

Schema-driven backend powered by FastBackend.

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

- `models.py` - SQLAlchemy schema (you own this)
- `fastbackend.yaml` - Configuration
- `.fastbackend/` - Generated IR and OpenAPI (gitignored)
- `app/custom/` - Custom endpoints (you own this)
