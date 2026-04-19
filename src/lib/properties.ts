/**
 * @fileoverview Property calculation utilities for molecular structures.
 * Provides functions to extract properties from SMILES strings and compute
 * Lipinski's Rule of Five violations.
 * @module properties
 */

import type { KekuleModule } from './loader.js';

// ── Types ─────────────────────────────────────────────────────

/**
 * Represents computed molecular properties from a SMILES string.
 * @interface MoleculeProperties
 */
export interface MoleculeProperties {
  /** Molecular formula in Hill notation (e.g., "C2H6O") */
  formula: string;
  /** Molecular weight in g/mol */
  molecularWeight: number;
  /** Total number of atoms including hydrogens */
  atomCount: number;
  /** Total number of bonds */
  bondCount: number;
  /** Number of ring systems (estimated via Euler's formula) */
  ringCount: number;
  /** Number of non-hydrogen atoms */
  heavyAtomCount: number;
  /** Whether the molecule was successfully parsed */
  isValid: boolean;
}

/**
 * Input parameters for Lipinski's Rule of Five calculation.
 * These values are typically computed from the molecule or predicted.
 * @interface LipinskiInput
 */
export interface LipinskiInput {
  /** Molecular weight in g/mol */
  mw: number;
  /** Log of partition coefficient (octanol/water) */
  logp: number;
  /** Number of hydrogen bond donors */
  hbd: number;
  /** Number of hydrogen bond acceptors */
  hba: number;
}

/**
 * Individual rule result from Lipinski's Rule of Five.
 * @interface LipinskiRule
 */
export interface LipinskiRule {
  /** Human-readable description of the rule */
  label: string;
  /** Actual calculated value */
  value: number;
  /** Maximum allowed value for this rule */
  limit: number;
  /** Whether this rule passes */
  pass: boolean;
}

/**
 * Result of Lipinski's Rule of Five evaluation.
 * @interface LipinskiResult
 */
export interface LipinskiResult {
  /** Whether all rules pass */
  pass: boolean;
  /** Per-rule pass/fail breakdown */
  rules: LipinskiRule[];
}

/**
 * Minimal interface for atoms returned by Kekule.js.
 * Provides a subset of methods used by this module.
 * @interface KekuleAtom
 */
export interface KekuleAtom {
  /** Get the element symbol (e.g., "C", "H", "O") */
  getSymbol?: () => string;
}

// ── Atomic weights (g/mol) ────────────────────────────────────

/**
 * Standard atomic weights for common elements.
 * Values from IUPAC (2021).
 * @constant
 */
const ATOMIC_WEIGHTS: Record<string, number> = {
  H: 1.008,
  He: 4.003,
  Li: 6.941,
  B: 10.811,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  F: 18.998,
  Na: 22.99,
  Mg: 24.305,
  Al: 26.982,
  Si: 28.086,
  P: 30.974,
  S: 32.065,
  Cl: 35.453,
  K: 39.098,
  Ca: 40.078,
  Fe: 55.845,
  Cu: 63.546,
  Zn: 65.38,
  Br: 79.904,
  I: 126.904,
};

// ── Functions ─────────────────────────────────────────────────

/**
 * Extract basic molecular properties from a SMILES string.
 * Parses the SMILES using Kekule.js and computes various properties.
 *
 * @param smiles - SMILES string to parse (e.g., "CCO" for ethanol)
 * @param Kekule - Pre-loaded Kekule module
 * @returns Object containing molecular properties, or null if parsing fails
 * @example
 * ```ts
 * const props = getMoleculeProperties('CCO', await loadKekule());
 * console.log(props?.molecularWeight); // ~46.07
 * ```
 */
export function getMoleculeProperties(
  smiles: string,
  Kekule: KekuleModule
): MoleculeProperties | null {
  try {
    const mol = Kekule.IO.loadFormatData(smiles, 'smi');
    if (!mol) return null;

    const atoms: KekuleAtom[] =
      (mol as { getLeafAtoms?: () => KekuleAtom[] }).getLeafAtoms?.() ?? [];
    const bonds: unknown[] = (mol as { getAllBonds?: () => unknown[] }).getAllBonds?.() ?? [];

    const heavy = atoms.filter((a: KekuleAtom) => {
      const sym = a.getSymbol?.() ?? '';
      return sym !== 'H' && sym !== '';
    });

    return {
      formula: computeFormula(atoms),
      molecularWeight: computeMolecularWeight(atoms),
      atomCount: atoms.length,
      bondCount: bonds.length,
      ringCount: computeRingCount(bonds.length, heavy.length),
      heavyAtomCount: heavy.length,
      isValid: true,
    };
  } catch {
    return null;
  }
}

/**
 * Compute molecular formula in Hill notation.
 * Carbon first, then hydrogen, then alphabetical by element symbol.
 *
 * @param atoms - Array of atom objects with getSymbol() method
 * @returns Formula string (e.g., "C2H6O" for ethanol)
 * @example
 * ```ts
 * const atoms = [{ getSymbol: () => 'C' }, { getSymbol: () => 'C' }, { getSymbol: () => 'O' }, ...];
 * computeFormula(atoms); // "C2H6O"
 * ```
 */
export function computeFormula(atoms: KekuleAtom[]): string {
  const counts: Record<string, number> = {};
  atoms.forEach((a: KekuleAtom) => {
    const sym = a.getSymbol?.() ?? '?';
    counts[sym] = (counts[sym] ?? 0) + 1;
  });
  const order = [
    'C',
    'H',
    ...Object.keys(counts)
      .filter((s) => s !== 'C' && s !== 'H')
      .sort(),
  ];
  return order
    .filter((s) => counts[s])
    .map((s) => (counts[s] === 1 ? s : `${s}${counts[s]}`))
    .join('');
}

/**
 * Compute approximate molecular weight from atom array.
 * Sums atomic weights for all atoms. Unknown elements contribute 0.
 *
 * @param atoms - Array of atom objects with getSymbol() method
 * @returns Molecular weight in g/mol, rounded to 2 decimal places
 * @example
 * ```ts
 * const atoms = [{ getSymbol: () => 'C' }, { getSymbol: () => 'C' }, { getSymbol: () => 'O' }, ...];
 * computeMolecularWeight(atoms); // 46.07
 * ```
 */
export function computeMolecularWeight(atoms: KekuleAtom[]): number {
  const raw = atoms.reduce((sum: number, a: KekuleAtom) => {
    const sym = a.getSymbol?.() ?? '';
    return sum + (ATOMIC_WEIGHTS[sym] ?? 0);
  }, 0);
  return Math.round(raw * 100) / 100;
}

/**
 * Estimate ring count using Euler's formula for connected graphs.
 * rings = bonds - atoms + 1
 *
 * @param bondCount - Total number of bonds in the molecule
 * @param heavyAtomCount - Number of non-hydrogen atoms
 * @returns Estimated number of rings (never negative)
 * @example
 * ```ts
 * computeRingCount(6, 6);  // 1 (benzene)
 * computeRingCount(2, 3); // 0 (ethanol)
 * ```
 */
export function computeRingCount(bondCount: number, heavyAtomCount: number): number {
  return Math.max(0, bondCount - heavyAtomCount + 1);
}

/**
 * Compute Lipinski's Rule of Five to assess drug-likeness.
 * All four rules must pass for the molecule to be considered drug-like.
 *
 * Rules:
 * - Molecular weight ≤ 500 g/mol
 * - LogP ≤ 5
 * - Hydrogen bond donors ≤ 5
 * - Hydrogen bond acceptors ≤ 10
 *
 * @param input - Object containing pre-calculated descriptor values
 * @returns Result object with overall pass/fail and per-rule breakdown
 * @example
 * ```ts
 * const result = computeLipinski({ mw: 180.16, logp: 1.19, hbd: 1, hba: 4 });
 * console.log(result.pass); // true (aspirin passes)
 * ```
 */
export function computeLipinski(input: LipinskiInput): LipinskiResult {
  const rules: LipinskiRule[] = [
    { label: 'Molecular weight ≤ 500', value: input.mw, limit: 500, pass: input.mw <= 500 },
    { label: 'LogP ≤ 5', value: input.logp, limit: 5, pass: input.logp <= 5 },
    { label: 'H-bond donors ≤ 5', value: input.hbd, limit: 5, pass: input.hbd <= 5 },
    { label: 'H-bond acceptors ≤ 10', value: input.hba, limit: 10, pass: input.hba <= 10 },
  ];
  return {
    pass: rules.every((r) => r.pass),
    rules,
  };
}

/**
 * Format a formula string with Unicode subscript digits.
 * Useful for display in UI contexts.
 *
 * @param formula - Formula string with ASCII digits (e.g., "C9H8O4")
 * @returns Formatted formula with subscripts (e.g., "C₉H₈O₄")
 * @example
 * ```ts
 * formatFormula('C9H8O4'); // "C₉H₈O₄"
 * formatFormula('H2O');   // "H₂O"
 * ```
 */
export function formatFormula(formula: string): string {
  const SUB: Record<string, string> = {
    '0': '₀',
    '1': '₁',
    '2': '₂',
    '3': '₃',
    '4': '₄',
    '5': '₅',
    '6': '₆',
    '7': '₇',
    '8': '₈',
    '9': '₉',
  };
  return formula.replace(/\d/g, (d) => SUB[d] ?? d);
}

/**
 * Validation result for SMILES string.
 * @interface ValidationResult
 */
export interface ValidationResult {
  /** Whether the SMILES is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Parsed molecule object if valid */
  molecule?: unknown;
}

/**
 * Convert result for chemical formats.
 * @interface ConvertResult
 */
export interface ConvertResult {
  /** Whether conversion was successful */
  success: boolean;
  /** Converted string output */
  output?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Validate a SMILES string syntax.
 * Checks if the string can be parsed as valid SMILES.
 *
 * @param smiles - SMILES string to validate
 * @param Kekule - Pre-loaded Kekule module
 * @returns Validation result with molecule object if valid
 * @example
 * ```ts
 * const result = validateSmiles('CCO', await loadKekule());
 * console.log(result.valid); // true
 *
 * const invalid = validateSmiles('invalid', await loadKekule());
 * console.log(invalid.valid); // false
 * console.log(invalid.error); // Error description
 * ```
 */
export function validateSmiles(smiles: string, Kekule: KekuleModule): ValidationResult {
  if (!smiles || typeof smiles !== 'string') {
    return { valid: false, error: 'SMILES string is required' };
  }

  try {
    const mol = Kekule.IO.loadFormatData(smiles.trim(), 'smi');
    if (!mol) {
      return { valid: false, error: 'Could not parse SMILES - invalid structure' };
    }
    return { valid: true, molecule: mol };
  } catch (e) {
    return {
      valid: false,
      error: e instanceof Error ? e.message : 'Unknown error parsing SMILES',
    };
  }
}

/**
 * Convert SMILES to MOL V2000 format.
 *
 * @param smiles - SMILES string to convert
 * @param Kekule - Pre-loaded Kekule module
 * @returns Convert result with MOL block if successful
 * @example
 * ```ts
 * const result = smilesToMol('CCO', await loadKekule());
 * console.log(result.success); // true
 * console.log(result.output);  // MOL block string
 * ```
 */
export function smilesToMol(smiles: string, Kekule: KekuleModule): ConvertResult {
  if (!smiles) {
    return { success: false, error: 'SMILES string is required' };
  }

  try {
    const mol = Kekule.IO.loadFormatData(smiles.trim(), 'smi');
    if (!mol) {
      return { success: false, error: 'Could not parse SMILES' };
    }

    const output = Kekule.IO.saveFormatData(mol, 'mol');
    if (!output) {
      return { success: false, error: 'Could not generate MOL format' };
    }

    return { success: true, output };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown conversion error',
    };
  }
}

/**
 * Convert SMILES to SDF (Structure-Data File) format.
 * SDF is a container format that can hold multiple molecules.
 *
 * @param smiles - SMILES string to convert
 * @param Kekule - Pre-loaded Kekule module
 * @returns Convert result with SDF string if successful
 * @example
 * ```ts
 * const result = smilesToSDF('CCO', await loadKekule());
 * console.log(result.success); // true
 * console.log(result.output);  // SDF formatted string
 * ```
 */
export function smilesToSDF(smiles: string, Kekule: KekuleModule): ConvertResult {
  if (!smiles) {
    return { success: false, error: 'SMILES string is required' };
  }

  try {
    const mol = Kekule.IO.loadFormatData(smiles.trim(), 'smi');
    if (!mol) {
      return { success: false, error: 'Could not parse SMILES' };
    }

    const output = Kekule.IO.saveFormatData(mol, 'sdf');
    if (!output) {
      return { success: false, error: 'Could not generate SDF format' };
    }

    return { success: true, output };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown conversion error',
    };
  }
}

/**
 * Convert SMILES to SMARTS pattern.
 *
 * @param smiles - SMILES string to convert
 * @param Kekule - Pre-loaded Kekule module
 * @returns Convert result with SMARTS string if successful
 */
export function smilesToSmarts(smiles: string, Kekule: KekuleModule): ConvertResult {
  if (!smiles) {
    return { success: false, error: 'SMILES string is required' };
  }

  try {
    const mol = Kekule.IO.loadFormatData(smiles.trim(), 'smi');
    if (!mol) {
      return { success: false, error: 'Could not parse SMILES' };
    }

    const output = Kekule.IO.saveFormatData(mol, 'smarts');
    if (!output) {
      return { success: false, error: 'Could not generate SMARTS format' };
    }

    return { success: true, output };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown conversion error',
    };
  }
}

/**
 * Parse MOL block and return molecule object.
 *
 * @param molBlock - MOL block string to parse
 * @param Kekule - Pre-loaded Kekule module
 * @returns Parsed molecule or null if invalid
 */
export function parseMolBlock(molBlock: string, Kekule: KekuleModule): unknown | null {
  if (!molBlock?.trim()) {
    return null;
  }

  try {
    return Kekule.IO.loadFormatData(molBlock.trim(), 'mol');
  } catch {
    return null;
  }
}
