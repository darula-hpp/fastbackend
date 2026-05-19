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

const PACKAGE_JSON = `{
  "name": "{{name}}",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx src/main.ts",
    "test": "vitest run",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "@fastbackend/express": "^0.1.1",
    "@prisma/client": "^6.5.0",
    "express": "^4.21.2"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "@types/supertest": "^6.0.3",
    "prisma": "^6.5.0",
    "supertest": "^7.0.0",
    "tsx": "^4.19.3",
    "typescript": "^5.6.0",
    "vitest": "^2.0.0"
  }
}
`;

const TSCONFIG = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src/**/*", "tests/**/*"]
}
`;

const MAIN_TS = `import { startServer } from '@fastbackend/express';

const portArgIndex = process.argv.indexOf('--port');
const port = portArgIndex >= 0 ? Number(process.argv[portArgIndex + 1]) : undefined;

startServer({ port }).catch((error) => {
  console.error(error);
  process.exit(1);
});
`;

const README_MD = `# {{name}}

Express + Prisma runtime powered by FastBackend.

## Setup

\`\`\`bash
npm install
cp .env.example .env
npx prisma migrate dev
\`\`\`

## Usage

\`\`\`bash
fastbackend generate
fastbackend dev
\`\`\`
`;

const ENV_EXAMPLE = `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/{{name}}
PORT=3000
`;

const VITEST_CONFIG = `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
`;

function render(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

export function scaffoldExpressProject(
  cwd: string,
  vars: Record<string, string>,
  docker?: boolean,
): string[] {
  const created: string[] = [];

  writeFile(join(cwd, vars.schemaPath), SCHEMA_PRISMA);
  created.push(vars.schemaPath);

  writeFile(join(cwd, 'package.json'), render(PACKAGE_JSON, vars));
  writeFile(join(cwd, 'tsconfig.json'), TSCONFIG);
  writeFile(join(cwd, 'vitest.config.ts'), VITEST_CONFIG);
  writeFile(join(cwd, 'src', 'main.ts'), MAIN_TS);
  writeFile(join(cwd, '.env.example'), render(ENV_EXAMPLE, vars));
  writeFile(join(cwd, 'README.md'), render(README_MD, vars));
  created.push('package.json', 'tsconfig.json', 'vitest.config.ts', 'src/main.ts', '.env.example', 'README.md');

  writeFile(
    join(cwd, 'src', 'custom', 'health.ts'),
    `import { Router } from 'express';

export const router = Router();

router.get('/health/custom', (_req, res) => {
  res.json({ custom: 'ok' });
});
`,
  );

  writeFile(
    join(cwd, 'src', 'custom', 'email.ts'),
    `import { Router } from 'express';

export const router = Router();

router.post('/users/:userId/send-email', (req, res) => {
  res.json({ status: 'sent', user_id: Number(req.params.userId) });
});
`,
  );
  created.push('src/custom/');

  writeFile(
    join(cwd, 'tests', 'health.test.ts'),
    `import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '@fastbackend/express';

describe('health endpoints', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it('returns runtime health', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBeGreaterThanOrEqual(200);
  });
});
`,
  );
  created.push('tests/');

  writeFile(
    join(cwd, '.gitignore'),
    `.fastbackend/
node_modules/
dist/
.env
`,
  );
  created.push('.gitignore');

  if (docker) {
    writeFile(
      join(cwd, 'Dockerfile'),
      `FROM node:22-slim

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npx prisma generate

EXPOSE {{port}}
CMD ["npx", "tsx", "src/main.ts", "--port", "{{port}}"]
`.replace(/\{\{port\}\}/g, vars.port),
    );
    created.push('Dockerfile');
  }

  return created;
}
