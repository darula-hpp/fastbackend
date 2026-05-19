import { join } from 'node:path';
import { writeFile } from '../file-ops.js';

const SCHEMA_PRISMA = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id    Int    @id @default(autoincrement())
  name  String
  email String @unique
  posts Post[]
}

model Post {
  id        Int     @id @default(autoincrement())
  title     String
  content   String?
  authorId  Int
  author    User    @relation(fields: [authorId], references: [id])
}
`;

const MODELS_PY = `from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship, DeclarativeBase


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)

    posts = relationship("Post", back_populates="author")


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    content = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    author = relationship("User", back_populates="posts")
`;

const MAIN_PY = `"""FastBackend application entry point."""

from fastbackend_fastapi import create_app

app = create_app()
`;

const REQUIREMENTS_TXT = `fastapi>=0.110.0
uvicorn>=0.27.0
sqlalchemy>=2.0.0
pydantic[email]>=2.0.0
fastbackend-fastapi
pytest>=8.0.0
httpx>=0.27.0
`;

const ENV_EXAMPLE_SQLALCHEMY = `PORT=8000
`;

const ENV_EXAMPLE_PRISMA = `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/{{name}}
PORT=8000
`;

const USERS_OVERRIDE_PY = `"""Override example: replace the generated GET /users/{id} route."""
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
`;

const TEST_OVERRIDES_PY = `def test_user_retrieve_override(client):
    response = client.get("/users/1")
    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "custom-override"
    assert body["email"] == "override@example.com"
`;

const README_MD = `# {{name}}

Schema-driven backend powered by FastBackend.

## Setup

\`\`\`bash
pip install -r requirements.txt
cp .env.example .env
npm install -g @fastbackend/cli
\`\`\`

## Usage

\`\`\`bash
fastbackend generate
fastbackend dev
\`\`\`
`;

const DOCKERFILE = `FROM python:3.12-slim AS builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim

WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY . .

EXPOSE {{port}}
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:{{port}}/health')"

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "{{port}}"]
`;

const DOCKER_COMPOSE = `services:
  api:
    build: .
    ports:
      - "{{port}}:{{port}}"
    volumes:
      - .:/app
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/{{name}}
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: {{name}}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  pgdata:
`;

function render(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

function getSchemaTemplate(format: string): string {
  switch (format) {
    case 'prisma':
      return SCHEMA_PRISMA;
    case 'sqlalchemy':
      return MODELS_PY;
    default:
      throw new Error(`Unsupported schema format: ${format}`);
  }
}

export function scaffoldFastApiProject(
  cwd: string,
  vars: Record<string, string>,
  docker?: boolean,
): string[] {
  const created: string[] = [];

  writeFile(join(cwd, vars.schemaPath), getSchemaTemplate(vars.schema));
  created.push(vars.schemaPath);

  writeFile(join(cwd, 'main.py'), MAIN_PY);
  created.push('main.py');

  writeFile(join(cwd, 'requirements.txt'), REQUIREMENTS_TXT);
  created.push('requirements.txt');

  writeFile(join(cwd, 'README.md'), render(README_MD, vars));
  created.push('README.md');

  writeFile(join(cwd, 'app', 'custom', '__init__.py'), '');
  writeFile(
    join(cwd, 'app', 'custom', 'health.py'),
    `from fastapi import APIRouter

router = APIRouter()


@router.get("/health/custom")
async def custom_health():
    return {"custom": "ok"}
`,
  );
  writeFile(
    join(cwd, 'app', 'custom', 'email.py'),
    `from fastapi import APIRouter

router = APIRouter()


@router.post("/users/{user_id}/send-email")
async def send_email(user_id: int):
    return {"status": "sent", "user_id": user_id}
`,
  );
  writeFile(join(cwd, 'app', 'custom', 'users_override.py'), USERS_OVERRIDE_PY);
  created.push('app/custom/');

  writeFile(
    join(cwd, '.env.example'),
    vars.schema === 'prisma' ? render(ENV_EXAMPLE_PRISMA, vars) : ENV_EXAMPLE_SQLALCHEMY,
  );
  created.push('.env.example');

  writeFile(
    join(cwd, 'tests', 'conftest.py'),
    `import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
`,
  );
  writeFile(
    join(cwd, 'tests', 'test_health.py'),
    `def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
`,
  );
  writeFile(join(cwd, 'tests', 'test_overrides.py'), TEST_OVERRIDES_PY);
  created.push('tests/');

  writeFile(join(cwd, '.gitignore'), `.fastbackend/
__pycache__/
*.pyc
.env
.venv/
`);
  created.push('.gitignore');

  if (docker) {
    writeFile(join(cwd, 'Dockerfile'), render(DOCKERFILE, vars));
    writeFile(join(cwd, 'docker-compose.yml'), render(DOCKER_COMPOSE, vars));
    created.push('Dockerfile', 'docker-compose.yml');
  }

  return created;
}
