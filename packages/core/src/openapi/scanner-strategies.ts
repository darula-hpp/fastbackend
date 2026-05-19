import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { RuntimeAdapterName } from '../runtime/types.js';

export interface ScannedEndpoint {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  tags?: string[];
  overrides?: string;
}

export interface OverrideMarker {
  path: string;
  method: string;
}

export interface ScanResult {
  endpoints: ScannedEndpoint[];
  overrides: OverrideMarker[];
}

export interface CustomEndpointScannerStrategy {
  findSourceFiles(dir: string): string[];
  extractFromFile(content: string): ScanResult;
}

const FASTAPI_ROUTE_PATTERN = /@router\.(get|post|put|delete|patch)\(\s*["']([^"']+)["']/g;
const EXPRESS_ROUTE_PATTERN =
  /(?:router|app)\.(get|post|put|delete|patch)\(\s*["']([^"']+)["']/g;
const OVERRIDE_PATTERN = /@(?:fastbackend\.)?override\(\s*["']([^"']+)["']\s*,\s*["'](\w+)["']\s*\)/g;

function extractDocstring(content: string, routeIndex: number): string | undefined {
  const window = content.slice(routeIndex, routeIndex + 500);
  const pyMatch = window.match(/"""([\s\S]*?)"""/);
  if (pyMatch) {
    return pyMatch[1]?.trim();
  }
  const jsMatch = window.match(/\/\*\*([\s\S]*?)\*\//);
  if (jsMatch) {
    return jsMatch[1]?.replace(/^\s*\*\s?/gm, '').trim();
  }
  return undefined;
}

function extractRoutesAndOverrides(
  content: string,
  routePattern: RegExp,
): ScanResult {
  const endpoints: ScannedEndpoint[] = [];
  const overrides: OverrideMarker[] = [];

  for (const match of content.matchAll(routePattern)) {
    const method = match[1];
    const path = match[2];
    const docstring = extractDocstring(content, match.index ?? 0);

    endpoints.push({
      path,
      method,
      summary: docstring?.split('\n')[0],
      description: docstring,
    });
  }

  for (const match of content.matchAll(OVERRIDE_PATTERN)) {
    const path = match[1];
    const method = match[2].toLowerCase();

    endpoints.push({
      path,
      method,
      overrides: `${method}:${path}`,
    });
    overrides.push({ path, method });
  }

  return { endpoints, overrides };
}

export class FastApiScannerStrategy implements CustomEndpointScannerStrategy {
  findSourceFiles(dir: string): string[] {
    return findFilesByExtension(dir, '.py', ['__init__.py']);
  }

  extractFromFile(content: string): ScanResult {
    return extractRoutesAndOverrides(content, FASTAPI_ROUTE_PATTERN);
  }
}

export class ExpressScannerStrategy implements CustomEndpointScannerStrategy {
  findSourceFiles(dir: string): string[] {
    return findFilesByExtension(dir, '.ts');
  }

  extractFromFile(content: string): ScanResult {
    return extractRoutesAndOverrides(content, EXPRESS_ROUTE_PATTERN);
  }
}

function findFilesByExtension(dir: string, ext: string, exclude: string[] = []): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  const files: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findFilesByExtension(fullPath, ext, exclude));
    } else if (entry.name.endsWith(ext) && !exclude.includes(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

export function getScannerStrategy(adapter: RuntimeAdapterName): CustomEndpointScannerStrategy {
  switch (adapter) {
    case 'express':
      return new ExpressScannerStrategy();
    case 'fastapi':
      return new FastApiScannerStrategy();
    default:
      return new FastApiScannerStrategy();
  }
}

export function scanCustomDirectory(customPath: string, adapter: RuntimeAdapterName): ScanResult {
  const strategy = getScannerStrategy(adapter);
  const endpoints: ScannedEndpoint[] = [];
  const overrides: OverrideMarker[] = [];

  for (const file of strategy.findSourceFiles(customPath)) {
    const extracted = strategy.extractFromFile(readFileSync(file, 'utf-8'));
    endpoints.push(...extracted.endpoints);
    overrides.push(...extracted.overrides);
  }

  return { endpoints, overrides };
}
