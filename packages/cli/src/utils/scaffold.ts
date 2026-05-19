import { join } from 'node:path';
import { writeFile, getProjectPaths } from './file-ops.js';

const FASTBACKEND_YAML = `project:
  name: {{name}}
  version: 1.0.0
  description: FastBackend API project

schema:
  format: {{schema}}
  path: {{schemaPath}}

adapter:
  name: {{adapter}}
  customPath: app/custom

openapi:
  outputPath: .fastbackend/openapi.yaml
  title: {{name}}
  version: 1.0.0
  servers:
    - url: http://localhost:8000
      description: Development server
  annotations:
    relationships: true

development:
  watch: true
  port: 8000
  hotReload: true
`;

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

const README_MD = `# {{name}}

Schema-driven backend powered by FastBackend.

## Setup

\`\`\`bash
pip install -r requirements.txt
npm install -g @fastbackend/cli
\`\`\`

## Usage

\`\`\`bash
# Generate IR and OpenAPI from schema
fastbackend generate

# Start development server
fastbackend dev
\`\`\`

## Project Structure

- \`{{schemaPath}}\` - Schema definition (you own this)
- \`fastbackend.yaml\` - Configuration
- \`.fastbackend/\` - Generated IR and OpenAPI (gitignored)
- \`app/custom/\` - Custom endpoints (you own this)
`;

const DOCKERFILE = `FROM python:3.12-slim AS builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim

WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY . .

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
`;

const DOCKER_COMPOSE = `services:
  api:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - .:/app
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/{{name}}
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
      interval: 30s
      timeout: 3s
      retries: 3

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

function getSchemaPath(format: string): string {
  switch (format) {
    case 'prisma':
      return 'schema.prisma';
    case 'sqlalchemy':
      return 'models.py';
    default:
      throw new Error(`Unsupported schema format: ${format}`);
  }
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

export interface ScaffoldOptions {
  name: string;
  schema: string;
  adapter: string;
  docker?: boolean;
}

export function scaffoldProject(cwd: string, options: ScaffoldOptions): string[] {
  const created: string[] = [];
  const schemaPath = getSchemaPath(options.schema);
  const vars = {
    name: options.name,
    schema: options.schema,
    schemaPath,
    adapter: options.adapter,
  };
  const paths = getProjectPaths(cwd);

  writeFile(paths.config, render(FASTBACKEND_YAML, vars));
  created.push('fastbackend.yaml');

  const schemaFilePath = join(cwd, schemaPath);
  writeFile(schemaFilePath, getSchemaTemplate(options.schema));
  created.push(schemaPath);

  writeFile(join(cwd, 'main.py'), MAIN_PY);
  created.push('main.py');

  writeFile(join(cwd, 'requirements.txt'), REQUIREMENTS_TXT);
  created.push('requirements.txt');

  writeFile(join(cwd, 'README.md'), render(README_MD, vars));
  created.push('README.md');

  writeFile(join(cwd, 'app', 'custom', '__init__.py'), '');
  writeFile(
    join(cwd, 'app', 'custom', 'health.py'),
    `"""Custom health check extensions."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/health/custom")
async def custom_health():
    return {"custom": "ok"}
`,
  );

  writeFile(
    join(cwd, 'app', 'custom', 'email.py'),
    `"""Custom email endpoint example."""
from fastapi import APIRouter

router = APIRouter()


@router.post("/users/{user_id}/send-email")
async def send_email(user_id: int):
    """Send a notification email to the user."""
    return {"status": "sent", "user_id": user_id}
`,
  );
  created.push('app/custom/');

  writeFile(
    join(cwd, 'tests', 'conftest.py'),
    `"""Shared pytest fixtures for FastBackend projects."""
import pytest
from fastapi.testclient import TestClient

from main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
`,
  );

  writeFile(
    join(cwd, 'tests', 'test_health.py'),
    `"""Health endpoint tests."""
from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_custom_health(client: TestClient) -> None:
    response = client.get("/health/custom")
    assert response.status_code == 200
    assert response.json()["custom"] == "ok"
`,
  );

  writeFile(
    join(cwd, 'tests', 'test_custom_endpoints.py'),
    `"""Custom endpoint tests."""
from fastapi.testclient import TestClient


def test_send_email(client: TestClient) -> None:
    response = client.post("/users/1/send-email")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "sent"
    assert body["user_id"] == 1
`,
  );
  created.push('tests/');

  writeFile(join(cwd, '.gitignore'), `.fastbackend/
__pycache__/
*.pyc
.env
.venv/
`);
  created.push('.gitignore');

  if (options.docker) {
    writeFile(join(cwd, 'Dockerfile'), DOCKERFILE);
    writeFile(join(cwd, 'docker-compose.yml'), render(DOCKER_COMPOSE, vars));
    created.push('Dockerfile', 'docker-compose.yml');
  }

  return created;
}
