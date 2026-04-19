// ── Components ────────────────────────────────────────────────
export { default as KekuleViewer } from './KekuleViewer.svelte';
export { default as KekuleEditor } from './KekuleEditor.svelte';
export { default as KekuleReaction } from './KekuleReaction.svelte';
export { default as Kekule3DViewer } from './Kekule3DViewer.svelte';

// ── Component types ───────────────────────────────────────────
export type { RenderMode } from './Kekule3DViewer.svelte';

// ── Loader ────────────────────────────────────────────────────
export { loadKekule, retryKekule, isKekuleReady, configureKekule } from './loader.js';
export type { KekuleModule } from './loader.js';

// ── Errors ────────────────────────────────────────────────────
export { KekuleError } from './errors.js';
export type { KekuleErrorCode } from './errors.js';

// ── Property utilities ────────────────────────────────────────
export {
  getMoleculeProperties,
  computeFormula,
  computeMolecularWeight,
  computeRingCount,
  computeLipinski,
  formatFormula,
  validateSmiles,
  smilesToMol,
  smilesToSDF,
  smilesToSmarts,
  parseMolBlock,
} from './properties.js';

export type {
  MoleculeProperties,
  LipinskiInput,
  LipinskiResult,
  LipinskiRule,
  ValidationResult,
  ConvertResult,
} from './properties.js';

/**
 * SSR Support Note:
 * Kekule.js requires the browser DOM. For SvelteKit SSR compatibility,
 * wrap usage in an `onMount` or use a dynamic import:
 *
 *   const { KekuleViewer } = await import('kekule-svelte');
 *
 * Or guard with `typeof window !== 'undefined' && typeof window.document !== 'undefined'`.
 */
