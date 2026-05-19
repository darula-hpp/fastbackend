export function override(_path: string, _method: string): MethodDecorator {
  return (_target, _propertyKey, descriptor) => descriptor;
}

export const OVERRIDE_PATTERN = /@(?:fastbackend\.)?override\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"](\w+)['"]\s*\)/g;
