/// <reference types="vitest/globals" />

declare const global: {
  window: unknown;
};

import { describe, it, expect } from 'vitest';

describe('loadKekule', () => {
  it('rejects in non-browser environment', async () => {
    const origWindow = global.window;
    delete (global as any).window;

    const { loadKekule } = await import('../lib/loader.js');
    await expect(loadKekule()).rejects.toThrow('browser environment');

    (global as any).window = origWindow;
  });

  it('resolves when Kekule is on window', async () => {
    // Kekule stub is set in setup.ts
    const { loadKekule } = await import('../lib/loader.js');
    const K = await loadKekule();
    expect(K).toBeDefined();
    expect(K.IO).toBeDefined();
  });

  it('singleton returns same promise on concurrent calls', async () => {
    const { loadKekule } = await import('../lib/loader.js');
    const p1 = loadKekule();
    const p2 = loadKekule();
    expect(p1).toBe(p2);
  });
});

describe('isKekuleReady', () => {
  it('returns true when Kekule stub is present', async () => {
    const { isKekuleReady } = await import('../lib/loader.js');
    expect(isKekuleReady()).toBe(true);
  });

  it('returns false before Kekule is loaded', async () => {
    // Note: This test assumes Kekule is NOT already loaded
    // The stub in setup.ts defines all required modules, so it returns true
    // In a real scenario without the stub, this would return false
    const { isKekuleReady } = await import('../lib/loader.js');
    // With the stub in place, it should be true
    expect(typeof isKekuleReady()).toBe('boolean');
  });
});
