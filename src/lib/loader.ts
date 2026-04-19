/**
 * @fileoverview Singleton loader for Kekule.js - loads the library from CDN once.
 * @module loader
 */

import { KekuleError } from './errors.js';
import type { KekuleErrorCode } from './errors.js';

/**
 * Type representing the Kekule.js module loaded from CDN.
 * Contains IO, ChemWidget, Editor, and CoordGenerator submodules.
 */
export type KekuleModule = {
  IO: {
    loadFormatData: (data: string, format: string) => unknown;
    saveFormatData: (data: unknown, format: string) => string | null;
  };
  ChemWidget: {
    Viewer: new (container: HTMLElement) => {
      setDimension: (width: string, height: string) => void;
      setPredefinedSetting: (setting: string) => void;
      setEnableToolbar: (enabled: boolean) => void;
      setEnableDirectInteraction: (enabled: boolean) => void;
      setChemObj: (obj: unknown) => void;
      repaint: () => void;
      finalize: () => void;
      exportToDataUri: (type: string) => string;
    };
    Viewer3D: new (container: HTMLElement) => {
      setDimension: (width: string, height: string) => void;
      setPredefinedSetting: (setting: string) => void;
      setEnableToolbar: (enabled: boolean) => void;
      setRenderType: (type: string) => void;
      setChemObj: (obj: unknown) => void;
      repaint: () => void;
      finalize: () => void;
      exportToDataUri: (type: string) => string;
      rotate: (x: number, y: number, z: number) => void;
      zoomToFit: () => void;
    };
  };
  Editor: {
    Composer: new (container: HTMLElement) => {
      setDimension: (width: string, height: string) => void;
      setEnableToolbar: (enabled: boolean) => void;
      setChemObj: (obj: unknown) => void;
      getChemObj: () => unknown;
      clearAll: () => void;
      undo: () => void;
      redo: () => void;
      addEventListener: (event: string, handler: () => void) => void;
      removeEventListener: (event: string, handler: () => void) => void;
      finalize: () => void;
      exportToDataUri: (type: string) => string;
    };
  };
  CoordGenerator: {
    prepare2DCoords: (mol: unknown) => void;
    prepare3DCoords: (mol: unknown) => void;
  };
  Widget: {
    [key: string]: unknown;
  };
};

// ── Configuration ─────────────────────────────────────────────

const DEFAULT_CDN_BASE = 'https://cdn.jsdelivr.net/npm/kekule@0.9.7/dist';
const DEFAULT_TIMEOUT_MS = 15_000;

interface KekuleConfig {
  /** Override CDN base URL (e.g. for self-hosted Kekule.js) */
  cdnBase?: string;
  /** Override initialisation timeout in ms (default: 15000) */
  timeout?: number;
}

let userConfig: KekuleConfig = {};

/**
 * Configure the Kekule.js loader before any component mounts.
 * Must be called before the first `loadKekule()` call.
 *
 * @example
 * ```ts
 * import { configureKekule } from 'kekule-svelte';
 * configureKekule({ cdnBase: '/vendor/kekule/dist', timeout: 30_000 });
 * ```
 */
export function configureKekule(opts: KekuleConfig): void {
  if (loadPromise) {
    console.warn('[kekule-svelte] configureKekule() called after Kekule was already loaded — config ignored');
    return;
  }
  userConfig = { ...opts };
}

// ── Internal helpers ──────────────────────────────────────────

function getCdnBase(): string {
  return userConfig.cdnBase ?? DEFAULT_CDN_BASE;
}

function getJsUrl(): string {
  return `${getCdnBase()}/kekule.min.js?modules=io,chemWidget,algorithm,widget`;
}

function getCssUrl(): string {
  return `${getCdnBase()}/themes/default/kekule.css`;
}

function getTimeout(): number {
  return userConfig.timeout ?? DEFAULT_TIMEOUT_MS;
}

const CSS_LINK_ID = 'kekule-svelte-css';
const POLL_INTERVAL_MS = 100;

let loadPromise: Promise<KekuleModule> | null = null;

/**
 * Inject the Kekule.js stylesheet into the document head (idempotent).
 * Required for toolbar, editor, and widget styling.
 */
function injectCSS(): void {
  if (document.getElementById(CSS_LINK_ID)) return;
  const link = document.createElement('link');
  link.id = CSS_LINK_ID;
  link.rel = 'stylesheet';
  link.href = getCssUrl();
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

function fail(message: string, code: KekuleErrorCode, cause?: unknown): KekuleError {
  return new KekuleError(`[kekule-svelte] ${message}`, code, cause);
}

// ── Public API ────────────────────────────────────────────────

/**
 * Load Kekule.js and return the global Kekule object.
 * Safe to call from multiple components simultaneously — returns a singleton promise.
 *
 * @throws {KekuleError} if the script fails to load, times out, or is called during SSR
 */
export function loadKekule(): Promise<KekuleModule> {
  if (typeof window === 'undefined') {
    return Promise.reject(fail('Kekule.js requires a browser environment', 'SSR_UNSUPPORTED'));
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise<KekuleModule>((resolve, reject) => {
    const existing = getGlobal();
    if (isReady(existing)) {
      injectCSS();
      resolve(existing!);
      return;
    }

    const scriptEl = document.querySelector('script[src*="kekule.min.js"]');
    if (scriptEl) {
      // Script is already in the DOM (probably initializing asynchronously)
      const poll = setInterval(() => {
        const K = getGlobal();
        if (isReady(K)) {
          clearInterval(poll);
          resolve(K!);
        }
      }, POLL_INTERVAL_MS);
      return;
    } else {
      injectCSS();
      resolve(existing!);
      return;
    }

    // Inject CSS alongside the script
    injectCSS();

    const script = document.createElement('script');
    script.src = getJsUrl();
    script.async = true;
    script.crossOrigin = 'anonymous';

    script.onload = () => {
      const start = Date.now();
      const timeout = getTimeout();

      const poll = setInterval(() => {
        const K = getGlobal();
        if (isReady(K)) {
          clearInterval(poll);
          resolve(K!);
          return;
        }
        if (Date.now() - start > timeout) {
          clearInterval(poll);
          loadPromise = null;
          reject(fail('Kekule.js timed out during initialisation', 'LOAD_TIMEOUT'));
        }
      }, POLL_INTERVAL_MS);
    };

    script.onerror = () => {
      loadPromise = null;
      reject(fail('Failed to load Kekule.js from CDN', 'LOAD_FAILED'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Reset the loader and attempt to load Kekule.js again.
 * Useful after a network failure or timeout.
 */
export function retryKekule(): Promise<KekuleModule> {
  loadPromise = null;
  return loadKekule();
}

/**
 * Returns true if Kekule.js is already loaded and fully initialised.
 */
export function isKekuleReady(): boolean {
  return isReady(getGlobal());
}

// ── Internal helpers ──────────────────────────────────────────

function getGlobal(): KekuleModule | undefined {
  return (globalThis as unknown as { Kekule?: KekuleModule }).Kekule;
}

function isReady(K: KekuleModule | undefined): boolean {
  return !!(K?.IO && K?.ChemWidget && K?.CoordGenerator && K?.Widget);
}
