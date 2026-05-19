import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CustomEndpointScanner } from '../custom-endpoint-scanner.js';

describe('CustomEndpointScanner file scanning', () => {
  let tempDir: string;
  const scanner = new CustomEndpointScanner();

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'fb-custom-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should scan Python files for router endpoints', () => {
    writeFileSync(
      join(tempDir, 'email.py'),
      `
from fastapi import APIRouter
router = APIRouter()

@router.post("/users/{id}/send-email")
def send_email(id: int):
    """Send email to user."""
    return {"status": "sent"}
`,
    );

    const endpoints = scanner.scan(tempDir);
    expect(endpoints.some((e) => e.path === '/users/{id}/send-email')).toBe(true);
    expect(endpoints[0].summary).toBe('Send email to user.');
  });

  it('should return empty results for missing directory', () => {
    expect(scanner.scan('/nonexistent/path')).toEqual([]);
    expect(scanner.getOverrides('/nonexistent/path')).toEqual([]);
  });

  it('should detect override markers in scanned files', () => {
    writeFileSync(
      join(tempDir, 'override.py'),
      `
@override("/users", "get")
@router.get("/users")
def custom():
    pass
`,
    );

    const overrides = scanner.getOverrides(tempDir);
    expect(overrides).toEqual([{ path: '/users', method: 'get' }]);
  });
});
