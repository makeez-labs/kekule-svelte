/// <reference types="vitest/globals" />

declare const global: {
  window: unknown;
  Kekule?: unknown;
};

import '@testing-library/svelte/vitest';
import { vi } from 'vitest';

// Stub out Kekule.js since we can't load it in jsdom
Object.defineProperty(global, 'Kekule', {
  writable: true,
  value: {
    IO: {
      loadFormatData: vi.fn(() => ({
        getLeafAtoms: () => [],
        getAllBonds: () => [],
      })),
      saveFormatData: vi.fn(() => 'CCO'),
    },
    ChemWidget: {
      Viewer: vi.fn().mockImplementation(() => ({
        setDimension: vi.fn(),
        setPredefinedSetting: vi.fn(),
        setEnableToolbar: vi.fn(),
        setEnableDirectInteraction: vi.fn(),
        setChemObj: vi.fn(),
        repaint: vi.fn(),
        finalize: vi.fn(),
        exportToDataUri: vi.fn(() => 'data:image/svg+xml;base64,abc'),
      })),
    },
    Editor: {
      Composer: vi.fn().mockImplementation(() => ({
        setDimension: vi.fn(),
        setEnableToolbar: vi.fn(),
        setChemObj: vi.fn(),
        getChemObj: vi.fn(() => ({})),
        clearAll: vi.fn(),
        undo: vi.fn(),
        redo: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        finalize: vi.fn(),
        exportToDataUri: vi.fn(() => 'data:image/svg+xml;base64,abc'),
      })),
    },
    CoordGenerator: {
      prepare2DCoords: vi.fn(),
      prepare3DCoords: vi.fn(),
    },
    Widget: {},
  },
});
