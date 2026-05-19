import { describe, it, expect } from 'vitest';
import { ExpressScannerStrategy, FastApiScannerStrategy } from '../scanner-strategies.js';

describe('Custom endpoint scanner strategies', () => {
  it('extracts FastAPI router routes', () => {
    const strategy = new FastApiScannerStrategy();
    const result = strategy.extractFromFile(`
from fastapi import APIRouter
router = APIRouter()

@router.post("/users/{user_id}/send-email")
async def send_email(user_id: int):
    """Send email"""
    return {"status": "sent"}
`);

    expect(result.endpoints).toHaveLength(1);
    expect(result.endpoints[0]?.path).toBe('/users/{user_id}/send-email');
    expect(result.endpoints[0]?.method).toBe('post');
  });

  it('extracts Express router routes', () => {
    const strategy = new ExpressScannerStrategy();
    const result = strategy.extractFromFile(`
import { Router } from 'express';
export const router = Router();

router.post('/users/:userId/send-email', async (_req, res) => {
  /** Send email */
  res.json({ status: 'sent' });
});
`);

    expect(result.endpoints).toHaveLength(1);
    expect(result.endpoints[0]?.path).toBe('/users/:userId/send-email');
    expect(result.endpoints[0]?.method).toBe('post');
  });

  it('extracts override markers from TypeScript files', () => {
    const strategy = new ExpressScannerStrategy();
    const result = strategy.extractFromFile(`
@fastbackend.override('/users/{id}', 'GET')
router.get('/users/:id', handler);
`);

    expect(result.overrides).toHaveLength(1);
    expect(result.overrides[0]).toEqual({ path: '/users/{id}', method: 'get' });
  });
});
