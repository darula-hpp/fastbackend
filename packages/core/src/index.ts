/**
 * @fastbackend/core
 *
 * Core schema parsing and IR generation for FastBackend framework.
 */

export * from './ir/types.js';
export * from './ir/generator.js';
export * from './ir/validator.js';
export * from './config/types.js';
export * from './config/loader.js';
export * from './parsers/plugin-interface.js';
export * from './parsers/bootstrap.js';
export * from './parsers/subprocess-runner.js';
export * from './parsers/sqlalchemy/plugin.js';
export * from './parsers/prisma/plugin.js';
export * from './parsers/prisma/parser.js';
export * from './openapi/generator.js';
export * from './openapi/custom-endpoint-scanner.js';
export * from './openapi/scanner-strategies.js';
export * from './runtime/index.js';
export * from './errors/index.js';
export * from './assets/locator.js';

import { bootstrapParsers } from './parsers/bootstrap.js';

bootstrapParsers();
