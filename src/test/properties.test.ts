import { describe, it, expect, vi } from 'vitest';
import {
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
} from '../lib/properties.js';

// Mock Kekule module for testing
const mockKekule = {
  IO: {
    loadFormatData: vi.fn((data: string, format: string) => {
      if (!data?.trim()) return null;
      if (format === 'smi' && data.trim() === 'INVALID') return null;
      if (format === 'mol' && !data.trim()) return null;
      return {
        getLeafAtoms: () =>
          data === 'CCO'
            ? [
                { getSymbol: () => 'C' },
                { getSymbol: () => 'C' },
                { getSymbol: () => 'H' },
                { getSymbol: () => 'H' },
                { getSymbol: () => 'H' },
                { getSymbol: () => 'H' },
                { getSymbol: () => 'H' },
                { getSymbol: () => 'H' },
                { getSymbol: () => 'O' },
              ]
            : [{ getSymbol: () => 'C' }],
        getAllBonds: () => [],
      };
    }),
    saveFormatData: vi.fn((mol: unknown, format: string) => {
      if (format === 'mol') return 'MOL block content';
      if (format === 'sdf') return 'SDF block content';
      if (format === 'smarts') return 'SMARTS pattern';
      return null;
    }),
  },
};

// ── helpers ───────────────────────────────────────────────────

function makeAtoms(symbols: string[]) {
  return symbols.map((sym) => ({ getSymbol: () => sym }));
}

// ── computeFormula ────────────────────────────────────────────

describe('computeFormula', () => {
  it('Hill notation: C before H before rest', () => {
    const atoms = makeAtoms(['C', 'C', 'O', 'H', 'H', 'H', 'H', 'H', 'H']);
    expect(computeFormula(atoms)).toBe('C2H6O');
  });

  it('single atom', () => {
    expect(computeFormula(makeAtoms(['C']))).toBe('C');
  });

  it('no carbon — alphabetical', () => {
    const atoms = makeAtoms(['H', 'H', 'O']);
    expect(computeFormula(atoms)).toBe('H2O');
  });

  it('handles empty atoms array', () => {
    expect(computeFormula([])).toBe('');
  });
});

// ── computeMolecularWeight ────────────────────────────────────

describe('computeMolecularWeight', () => {
  it('ethanol C2H6O ≈ 46 g/mol', () => {
    const atoms = makeAtoms(['C', 'C', 'H', 'H', 'H', 'H', 'H', 'H', 'O']);
    const mw = computeMolecularWeight(atoms);
    expect(mw).toBeCloseTo(46.07, 1);
  });

  it('unknown element contributes 0', () => {
    const atoms = makeAtoms(['X']);
    expect(computeMolecularWeight(atoms)).toBe(0);
  });

  it('handles empty atoms array', () => {
    expect(computeMolecularWeight([])).toBe(0);
  });
});

// ── computeRingCount ──────────────────────────────────────────

describe('computeRingCount', () => {
  it('benzene: 6 bonds, 6 atoms → 1 ring', () => {
    expect(computeRingCount(6, 6)).toBe(1);
  });

  it('ethanol: 2 bonds, 3 atoms → 0 rings', () => {
    expect(computeRingCount(2, 3)).toBe(0);
  });

  it('never returns negative', () => {
    expect(computeRingCount(0, 10)).toBe(0);
  });

  it('handles single atom', () => {
    expect(computeRingCount(0, 1)).toBe(0);
  });

  it('handles disconnected graph', () => {
    expect(computeRingCount(5, 3)).toBe(3);
  });
});

// ── computeLipinski ───────────────────────────────────────────

describe('computeLipinski', () => {
  it('aspirin passes all rules', () => {
    const r = computeLipinski({ mw: 180.16, logp: 1.19, hbd: 1, hba: 4 });
    expect(r.pass).toBe(true);
    expect(r.rules.every((rule) => rule.pass)).toBe(true);
  });

  it('fails when MW > 500', () => {
    const r = computeLipinski({ mw: 600, logp: 1, hbd: 1, hba: 2 });
    expect(r.pass).toBe(false);
    expect(r.rules.find((rule) => rule.label.includes('weight'))?.pass).toBe(false);
  });

  it('fails when logP > 5', () => {
    const r = computeLipinski({ mw: 200, logp: 6, hbd: 1, hba: 2 });
    expect(r.pass).toBe(false);
  });

  it('fails when HBD > 5', () => {
    const r = computeLipinski({ mw: 200, logp: 1, hbd: 6, hba: 2 });
    expect(r.pass).toBe(false);
  });

  it('fails when HBA > 10', () => {
    const r = computeLipinski({ mw: 200, logp: 1, hbd: 1, hba: 11 });
    expect(r.pass).toBe(false);
  });

  it('returns 4 rules', () => {
    const r = computeLipinski({ mw: 200, logp: 1, hbd: 1, hba: 2 });
    expect(r.rules).toHaveLength(4);
  });

  it('handles boundary values exactly - passes at 500, 5, 5, 10', () => {
    expect(computeLipinski({ mw: 500, logp: 5, hbd: 5, hba: 10 }).pass).toBe(true);
  });

  it('fails at boundary + 1 for MW', () => {
    expect(computeLipinski({ mw: 501, logp: 5, hbd: 5, hba: 10 }).pass).toBe(false);
  });

  it('fails at boundary + 0.1 for logP', () => {
    expect(computeLipinski({ mw: 500, logp: 5.1, hbd: 5, hba: 10 }).pass).toBe(false);
  });

  it('fails at boundary + 1 for HBD', () => {
    expect(computeLipinski({ mw: 500, logp: 5, hbd: 6, hba: 10 }).pass).toBe(false);
  });

  it('fails at boundary + 1 for HBA', () => {
    expect(computeLipinski({ mw: 500, logp: 5, hbd: 5, hba: 11 }).pass).toBe(false);
  });
});

// ── formatFormula ─────────────────────────────────────────────

describe('formatFormula', () => {
  it('converts digits to subscripts', () => {
    expect(formatFormula('C9H8O4')).toBe('C₉H₈O₄');
  });

  it('leaves non-digit chars unchanged', () => {
    expect(formatFormula('H2O')).toBe('H₂O');
  });

  it('handles double-digit counts', () => {
    expect(formatFormula('C27H46O')).toBe('C₂₇H₄₆O');
  });

  it('no digits — unchanged', () => {
    expect(formatFormula('CO')).toBe('CO');
  });

  it('handles empty string', () => {
    expect(formatFormula('')).toBe('');
  });

  it('handles all digits', () => {
    expect(formatFormula('123')).toBe('\u2081\u2082\u2083');
  });
});

// ── validateSmiles ─────────────────────────────────────────────

describe('validateSmiles', () => {
  it('validates a correct SMILES string', () => {
    const result = validateSmiles('CCO', mockKekule as any);
    expect(result.valid).toBe(true);
    expect(result.molecule).toBeDefined();
  });

  it('rejects empty SMILES string', () => {
    const result = validateSmiles('', mockKekule as any);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('SMILES string is required');
  });

  it('rejects null SMILES', () => {
    const result = validateSmiles(null as any, mockKekule as any);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('SMILES string is required');
  });

  it('rejects undefined SMILES', () => {
    const result = validateSmiles(undefined as any, mockKekule as any);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('SMILES string is required');
  });

  it('rejects invalid SMILES', () => {
    const result = validateSmiles('INVALID', mockKekule as any);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Could not parse');
  });

  it('trims whitespace from SMILES', () => {
    const result = validateSmiles('  CCO  ', mockKekule as any);
    expect(result.valid).toBe(true);
  });
});

// ── smilesToMol ────────────────────────────────────────────────

describe('smilesToMol', () => {
  it('converts valid SMILES to MOL', () => {
    const result = smilesToMol('CCO', mockKekule as any);
    expect(result.success).toBe(true);
    expect(result.output).toBe('MOL block content');
  });

  it('rejects empty SMILES', () => {
    const result = smilesToMol('', mockKekule as any);
    expect(result.success).toBe(false);
    expect(result.error).toBe('SMILES string is required');
  });

  it('rejects invalid SMILES', () => {
    const result = smilesToMol('INVALID', mockKekule as any);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Could not parse');
  });

  it('handles null Kekule', () => {
    const result = smilesToMol('CCO', null as any);
    expect(result.success).toBe(false);
  });
});

// ── smilesToSDF ────────────────────────────────────────────────

describe('smilesToSDF', () => {
  it('converts valid SMILES to SDF', () => {
    const result = smilesToSDF('CCO', mockKekule as any);
    expect(result.success).toBe(true);
    expect(result.output).toBe('SDF block content');
  });

  it('rejects empty SMILES', () => {
    const result = smilesToSDF('', mockKekule as any);
    expect(result.success).toBe(false);
    expect(result.error).toBe('SMILES string is required');
  });
});

// ── smilesToSmarts ─────────────────────────────────────────────

describe('smilesToSmarts', () => {
  it('converts valid SMILES to SMARTS', () => {
    const result = smilesToSmarts('CCO', mockKekule as any);
    expect(result.success).toBe(true);
    expect(result.output).toBe('SMARTS pattern');
  });

  it('rejects empty SMILES', () => {
    const result = smilesToSmarts('', mockKekule as any);
    expect(result.success).toBe(false);
    expect(result.error).toBe('SMILES string is required');
  });
});

// ── parseMolBlock ─────────────────────────────────────────────

describe('parseMolBlock', () => {
  it('parses valid MOL block', () => {
    const result = parseMolBlock('MOL block content', mockKekule as any);
    expect(result).toBeDefined();
  });

  it('returns null for empty MOL block', () => {
    const result = parseMolBlock('', mockKekule as any);
    expect(result).toBeNull();
  });

  it('returns null for whitespace-only MOL block', () => {
    const result = parseMolBlock('   ', mockKekule as any);
    expect(result).toBeNull();
  });

  it('returns null for null input', () => {
    expect(parseMolBlock(null as any, mockKekule as any)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(parseMolBlock(undefined as any, mockKekule as any)).toBeNull();
  });

  it('handles null Kekule', () => {
    const result = parseMolBlock('MOL', null as any);
    expect(result).toBeNull();
  });
});
