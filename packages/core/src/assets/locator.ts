import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CodeGenerationError } from '../errors/index.js';

/**
 * Resolves assets colocated with the calling module.
 * Build copies assets into dist/ mirroring src/ layout.
 */
export function resolveColocatedAsset(moduleUrl: string, filename: string): string {
  const assetPath = join(dirname(fileURLToPath(moduleUrl)), filename);

  if (!existsSync(assetPath)) {
    throw new CodeGenerationError(
      'AssetLocator',
      `Colocated asset not found: ${assetPath}`,
    );
  }

  return assetPath;
}
