import { describe, it, expect } from 'vitest';
import { RouteRegistry } from '../route-registry.js';

describe('RouteRegistry', () => {
  it('tracks routes and overrides independently', () => {
    const registry = new RouteRegistry();

    registry.register('/users', ['GET', 'POST'], { entity: 'User' });
    registry.markOverride('GET', '/users/{id}');

    expect(registry.isOverridden('GET', '/users/{id}')).toBe(true);
    expect(registry.isOverridden('PUT', '/users/{id}')).toBe(false);

    const summary = registry.summary();
    expect(summary.routeCount).toBe(1);
    expect(summary.overrideCount).toBe(1);
  });

  it('normalizes express-style paths when checking overrides', () => {
    const registry = new RouteRegistry();
    registry.markOverride('delete', '/users/{id}');

    expect(registry.isOverridden('DELETE', '/users/:id')).toBe(true);
  });
});
