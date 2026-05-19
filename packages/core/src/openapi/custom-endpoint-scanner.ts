import type { OpenAPISpec } from './generator.js';
import type { RuntimeAdapterName } from '../runtime/types.js';
import { scanCustomDirectory } from './scanner-strategies.js';

export type { ScannedEndpoint as CustomEndpoint, OverrideMarker } from './scanner-strategies.js';

export class CustomEndpointScanner {
  constructor(private readonly adapter: RuntimeAdapterName = 'fastapi') {}

  scan(customPath: string) {
    return scanCustomDirectory(customPath, this.adapter).endpoints;
  }

  getOverrides(customPath: string) {
    return scanCustomDirectory(customPath, this.adapter).overrides;
  }

  mergeCustomEndpoints(spec: OpenAPISpec, customPath: string): OpenAPISpec {
    const { endpoints, overrides } = scanCustomDirectory(customPath, this.adapter);
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
}
