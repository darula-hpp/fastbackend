import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { OpenAPISpec } from './generator.js';

interface CustomEndpoint {
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

interface ScanResult {
  endpoints: CustomEndpoint[];
  overrides: OverrideMarker[];
}

const ROUTE_PATTERN = /@router\.(get|post|put|delete|patch)\(\s*["']([^"']+)["']/g;
const OVERRIDE_PATTERN = /@(?:fastbackend\.)?override\(\s*["']([^"']+)["']\s*,\s*["'](\w+)["']\s*\)/g;

export class CustomEndpointScanner {
  scan(customPath: string): CustomEndpoint[] {
    return this.scanDirectory(customPath).endpoints;
  }

  getOverrides(customPath: string): OverrideMarker[] {
    return this.scanDirectory(customPath).overrides;
  }

  mergeCustomEndpoints(spec: OpenAPISpec, customPath: string): OpenAPISpec {
    const { endpoints, overrides } = this.scanDirectory(customPath);
    const merged = structuredClone(spec);

    for (const override of overrides) {
      const pathItem = merged.paths[override.path];
      if (!pathItem) {
        continue;
      }

      delete pathItem[override.method as keyof typeof pathItem];
      if (Object.keys(pathItem).length === 0) {
        delete merged.paths[override.path];
      }
    }

    for (const endpoint of endpoints) {
      if (endpoint.overrides) {
        continue;
      }

      const method = endpoint.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch';
      const pathItem = merged.paths[endpoint.path] ?? {};

      pathItem[method] = {
        tags: endpoint.tags ?? ['Custom'],
        summary: endpoint.summary ?? endpoint.description ?? `Custom ${method.toUpperCase()} ${endpoint.path}`,
        description: endpoint.description,
        responses: {
          '200': { description: 'Successful response' },
        },
      };

      merged.paths[endpoint.path] = pathItem;
    }

    for (const override of overrides) {
      const method = override.method as 'get' | 'post' | 'put' | 'delete' | 'patch';
      const pathItem = merged.paths[override.path] ?? {};

      pathItem[method] = {
        tags: ['Override'],
        summary: `Overridden ${method.toUpperCase()} ${override.path}`,
        description: 'Custom implementation replaces runtime-created endpoint',
        responses: {
          '200': { description: 'Successful response' },
        },
        'x-fastbackend-override': true,
      };

      merged.paths[override.path] = pathItem;
    }

    return merged;
  }

  private scanDirectory(customPath: string): ScanResult {
    if (!existsSync(customPath)) {
      return { endpoints: [], overrides: [] };
    }

    const endpoints: CustomEndpoint[] = [];
    const overrides: OverrideMarker[] = [];

    for (const file of this.findPythonFiles(customPath)) {
      const extracted = this.extractFromFile(readFileSync(file, 'utf-8'));
      endpoints.push(...extracted.endpoints);
      overrides.push(...extracted.overrides);
    }

    return { endpoints, overrides };
  }

  private findPythonFiles(dir: string): string[] {
    const files: string[] = [];

    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...this.findPythonFiles(fullPath));
      } else if (entry.name.endsWith('.py') && entry.name !== '__init__.py') {
        files.push(fullPath);
      }
    }

    return files;
  }

  private extractFromFile(content: string): ScanResult {
    const endpoints: CustomEndpoint[] = [];
    const overrides: OverrideMarker[] = [];

    for (const match of content.matchAll(ROUTE_PATTERN)) {
      const method = match[1];
      const path = match[2];
      const docstring = this.extractDocstring(content, match.index ?? 0);

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

  private extractDocstring(content: string, routeIndex: number): string | undefined {
    const window = content.slice(routeIndex, routeIndex + 500);
    const match = window.match(/"""([\s\S]*?)"""/);
    return match?.[1]?.trim();
  }
}
