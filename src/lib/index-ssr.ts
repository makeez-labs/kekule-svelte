export { default as KekuleViewer } from './KekuleViewer.svelte';
export { default as KekuleEditor } from './KekuleEditor.svelte';
export { default as KekuleReaction } from './KekuleReaction.svelte';
export { default as Kekule3DViewer } from './Kekule3DViewer.svelte';

export type { RenderMode } from './Kekule3DViewer.svelte';

export { loadKekule, retryKekule, isKekuleReady, configureKekule } from './loader.js';
export type { KekuleModule } from './loader.js';

export { KekuleError } from './errors.js';
export type { KekuleErrorCode } from './errors.js';

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
