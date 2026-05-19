import { describe, it, expect } from 'vitest';
import { pluralize, toPrismaDelegateKey, expressPathToOpenApi, openApiPathToExpress } from '../path-utils.js';

describe('path-utils', () => {
  it('pluralizes entity names', () => {
    expect(pluralize('User')).toBe('users');
    expect(pluralize('Category')).toBe('categories');
    expect(pluralize('Box')).toBe('boxes');
  });

  it('maps entity names to Prisma delegate keys', () => {
    expect(toPrismaDelegateKey('User')).toBe('user');
    expect(toPrismaDelegateKey('BlogPost')).toBe('blogPost');
  });

  it('converts between OpenAPI and Express path syntax', () => {
    expect(openApiPathToExpress('/users/{id}/posts')).toBe('/users/:id/posts');
    expect(expressPathToOpenApi('/users/:id/posts')).toBe('/users/{id}/posts');
  });
});
