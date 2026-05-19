export function pluralize(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('y')) {
    return `${lower.slice(0, -1)}ies`;
  }
  if (lower.endsWith('s') || lower.endsWith('x') || lower.endsWith('ch') || lower.endsWith('sh')) {
    return `${lower}es`;
  }
  return `${lower}s`;
}

export function toPrismaDelegateKey(entityName: string): string {
  return entityName.charAt(0).toLowerCase() + entityName.slice(1);
}

export function expressPathToOpenApi(path: string): string {
  return path.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

export function openApiPathToExpress(path: string): string {
  return path.replace(/\{([A-Za-z0-9_]+)\}/g, ':$1');
}
