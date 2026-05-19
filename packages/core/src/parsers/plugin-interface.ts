/**
 * Schema parser plugin interface and registry.
 */

import type { ParserConfig } from '../config/types.js';
import type { ParsedSchema, ValidationResult } from '../ir/types.js';

export interface SchemaParserPlugin {
  name: string;
  supportedFormats: string[];
  parse(schemaPath: string, config: ParserConfig): Promise<ParsedSchema>;
  validate(schemaPath: string): Promise<ValidationResult>;
}

class PluginRegistry {
  private plugins = new Map<string, SchemaParserPlugin>();

  register(plugin: SchemaParserPlugin): void {
    for (const format of plugin.supportedFormats) {
      this.plugins.set(format, plugin);
    }
  }

  get(format: string): SchemaParserPlugin | undefined {
    return this.plugins.get(format);
  }

  getOrThrow(format: string): SchemaParserPlugin {
    const plugin = this.plugins.get(format);
    if (!plugin) {
      throw new Error(`No schema parser registered for format: ${format}`);
    }
    return plugin;
  }

  listFormats(): string[] {
    return [...this.plugins.keys()];
  }
}

export const pluginRegistry = new PluginRegistry();
