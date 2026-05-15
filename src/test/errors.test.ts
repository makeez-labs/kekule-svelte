import { describe, it, expect } from 'vitest';
import { KekuleError } from '../lib/errors.js';
import type { KekuleErrorCode } from '../lib/errors.js';

describe('KekuleError', () => {
  it('is an instance of Error', () => {
    const err = new KekuleError('test', 'LOAD_FAILED');
    expect(err).toBeInstanceOf(Error);
  });

  it('has the correct name', () => {
    const err = new KekuleError('test', 'LOAD_FAILED');
    expect(err.name).toBe('KekuleError');
  });

  it('stores the message', () => {
    const err = new KekuleError('something went wrong', 'LOAD_FAILED');
    expect(err.message).toBe('something went wrong');
  });

  it('stores the error code', () => {
    const err = new KekuleError('test', 'LOAD_TIMEOUT');
    expect(err.code).toBe('LOAD_TIMEOUT');
  });

  it('accepts all valid error codes', () => {
    const codes: KekuleErrorCode[] = [
      'LOAD_FAILED',
      'LOAD_TIMEOUT',
      'PARSE_FAILED',
      'RENDER_FAILED',
      'SSR_UNSUPPORTED',
    ];
    for (const code of codes) {
      const err = new KekuleError('test', code);
      expect(err.code).toBe(code);
    }
  });

  it('stores cause when provided', () => {
    const cause = new Error('underlying issue');
    const err = new KekuleError('test', 'PARSE_FAILED', cause);
    expect(err.cause).toBe(cause);
  });

  it('cause is undefined when not provided', () => {
    const err = new KekuleError('test', 'RENDER_FAILED');
    expect(err.cause).toBeUndefined();
  });

  it('message can include code prefix for context', () => {
    const err = new KekuleError('[kekule-svelte] Failed to load', 'LOAD_FAILED');
    expect(err.message).toContain('[kekule-svelte]');
  });
});
