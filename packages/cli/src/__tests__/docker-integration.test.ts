import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { copyDir } from '../utils/file-ops.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = join(__dirname, '..', '..', 'dist', 'index.js');
const FASTAPI_PKG = join(__dirname, '..', '..', '..', 'fastapi');

function isDockerAvailable(): boolean {
  return spawnSync('docker', ['version'], { stdio: 'ignore' }).status === 0;
}

async function waitForHealth(port: string): Promise<void> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`, {
        signal: controller.signal,
      });
      if (response.ok) {
        const body = await response.json();
        if (body.status === 'healthy') {
          return;
        }
      }
    } catch {
      // retry until timeout
    } finally {
      clearTimeout(timeout);
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

  throw new Error('Timed out waiting for container health endpoint');
}

describe.skipIf(!isDockerAvailable())('Docker integration', () => {
  let projectDir: string;
  let apiDir: string;
  let imageTag: string;
  let hostPort: number;
  let containerId: string | undefined;

  beforeAll(() => {
    projectDir = mkdtempSync(join(tmpdir(), 'fb-docker-'));
    imageTag = `fastbackend-test:${Date.now()}`;
    hostPort = 18080 + (Date.now() % 1000);

    execSync(`node "${CLI}" init docker-it --schema sqlalchemy --adapter fastapi --docker`, {
      cwd: projectDir,
      stdio: 'pipe',
    });

    apiDir = join(projectDir, 'docker-it');
    execSync(`node "${CLI}" generate`, { cwd: apiDir, stdio: 'pipe' });

    copyDir(FASTAPI_PKG, join(apiDir, 'fastbackend-fastapi'));
    writeFileSync(
      join(apiDir, 'requirements.txt'),
      `fastapi>=0.110.0
uvicorn>=0.27.0
sqlalchemy>=2.0.0
pydantic[email]>=2.0.0
email-validator>=2.0.0
fastbackend-fastapi @ file:./fastbackend-fastapi
`,
    );
    writeFileSync(
      join(apiDir, 'Dockerfile'),
      `FROM python:3.12-slim AS builder

WORKDIR /app
COPY fastbackend-fastapi ./fastbackend-fastapi
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim

WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY . .

EXPOSE 8000
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
`,
    );
  }, 120000);

  afterAll(() => {
    if (containerId) {
      spawnSync('docker', ['rm', '-f', containerId], { stdio: 'ignore' });
    }
    if (projectDir) {
      rmSync(projectDir, { recursive: true, force: true });
    }
  });

  it('builds image and serves /health', async () => {
    execSync(`docker build -t ${imageTag} .`, { cwd: apiDir, stdio: 'pipe' });

    const runResult = spawnSync(
      'docker',
      ['run', '-d', '-p', `${hostPort}:8000`, imageTag],
      { encoding: 'utf-8' },
    );
    expect(runResult.status).toBe(0);

    containerId = runResult.stdout.trim();
    expect(containerId.length).toBeGreaterThan(0);

    await waitForHealth(String(hostPort));
  }, 300000);
});
