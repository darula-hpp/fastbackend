import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import type { Express, Router } from 'express';
import { pathToFileURL } from 'node:url';
import type { RouteRegistry } from './route-registry.js';
import { OVERRIDE_PATTERN } from '../decorators/override.js';

export function scanOverrideMarkers(customPath: string, registry: RouteRegistry): void {
  if (!existsSync(customPath)) {
    return;
  }

  for (const file of findTypeScriptFiles(customPath)) {
    const content = readFileSync(file, 'utf-8');
    for (const match of content.matchAll(OVERRIDE_PATTERN)) {
      registry.markOverride(match[2], match[1]);
    }
  }
}

export async function registerCustomRoutes(app: Express, customPath: string, registry: RouteRegistry): Promise<number> {
  if (!existsSync(customPath)) {
    return 0;
  }

  let count = 0;
  for (const file of findTypeScriptFiles(customPath)) {
    const content = readFileSync(file, 'utf-8');
    if (!hasRouterExport(content)) {
      continue;
    }

    const module = await import(pathToFileURL(file).href);
    const router: Router | undefined = module.router ?? module.default;
    if (router) {
      app.use(router);
      registry.register(`custom:${file}`, ['*'], { isCustom: true });
      count += 1;
    }
  }

  return count;
}

function findTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findTypeScriptFiles(fullPath));
    } else if (extname(entry.name) === '.ts' && !entry.name.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

function hasRouterExport(content: string): boolean {
  return /export\s+(?:const|function)\s+router|export\s+default/.test(content);
}
