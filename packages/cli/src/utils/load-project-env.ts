import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export function loadProjectEnv(cwd: string): NodeJS.ProcessEnv {
  const env = { ...process.env };
  applyProjectEnvFile(env, cwd);
  return env;
}

export function applyProjectEnv(cwd: string = process.cwd()): void {
  applyProjectEnvFile(process.env, cwd);
}

function applyProjectEnvFile(env: NodeJS.ProcessEnv, cwd: string): void {
  const envPath = join(cwd, '.env');

  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (env[key] === undefined) {
      env[key] = value;
    }
  }
}
