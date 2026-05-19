import { describe, it, expect } from 'vitest';
import { buildCommand } from '../build.js';

describe('buildCommand', () => {
  it('should be a function', () => {
    expect(typeof buildCommand).toBe('function');
  });
});
