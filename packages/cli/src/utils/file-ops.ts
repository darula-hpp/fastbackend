import { mkdirSync, writeFileSync, existsSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';

export function ensureDir(dirPath: string): void {
  mkdirSync(dirPath, { recursive: true });
}

export function writeFile(filePath: string, content: string): void {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, content, 'utf-8');
}

export function fileExists(filePath: string): boolean {
  return existsSync(filePath);
}

export function copyDir(src: string, dest: string): void {
  cpSync(src, dest, { recursive: true });
}

export function getProjectPaths(cwd: string) {
  return {
    config: join(cwd, 'fastbackend.yaml'),
    ir: join(cwd, '.fastbackend', 'ir.json'),
    openapi: join(cwd, '.fastbackend', 'openapi.yaml'),
    custom: join(cwd, 'app', 'custom'),
    models: join(cwd, 'models.py'),
  };
}
