export class RouteRegistry {
  private readonly routes = new Map<string, Set<string>>();
  private readonly overrides = new Set<string>();
  private readonly customRoutes = new Set<string>();

  register(path: string, methods: string[], meta?: { entity?: string; relationship?: string; isCustom?: boolean }): void {
    const key = this.normalizePath(path);
    const existing = this.routes.get(key) ?? new Set<string>();
    for (const method of methods) {
      existing.add(method.toUpperCase());
    }
    this.routes.set(key, existing);

    if (meta?.isCustom) {
      this.customRoutes.add(key);
    }
  }

  markOverride(method: string, path: string): void {
    this.overrides.add(this.overrideKey(method, path));
  }

  isOverridden(method: string, path: string): boolean {
    return this.overrides.has(this.overrideKey(method, path));
  }

  summary(): Record<string, unknown> {
    return {
      routeCount: this.routes.size,
      overrideCount: this.overrides.size,
      customRouteCount: this.customRoutes.size,
      routes: Object.fromEntries(
        [...this.routes.entries()].map(([path, methods]) => [path, [...methods]]),
      ),
    };
  }

  private overrideKey(method: string, path: string): string {
    return `${method.toUpperCase()}:${this.normalizePath(path)}`;
  }

  private normalizePath(path: string): string {
    return path.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
  }
}
