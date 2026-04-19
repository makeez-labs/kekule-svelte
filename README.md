# kekule-svelte

Svelte 5 wrapper for [Kekule.js](http://partridgejiang.github.io/Kekule.js/) - render and edit organic compound structures from SMILES strings.

[![npm version](https://img.shields.io/npm/v/kekule-svelte)](https://www.npmjs.com/package/kekule-svelte)
[![CI](https://github.com/makeez-labs/kekule-svelte/actions/workflows/ci.yml/badge.svg)](https://github.com/makeez-labs/kekule-svelte/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Overview

kekule-svelte provides Svelte 5 components for rendering and editing chemical molecular structures. It wraps Kekule.js, a powerful JavaScript library for chemoinformatics, and offers:

- Read-only 2D molecular structure viewers
- 3D molecular structure viewers with WebGL
- Full interactive structure editors
- Reaction diagram rendering
- SMILES validation and conversion utilities
- Molecular property calculations
- Export to SVG and PNG formats

## Installation

```bash
bun add kekule-svelte
# or
npm install kekule-svelte
```

## Quick Start

```svelte
<script lang="ts">
  import { KekuleViewer } from 'kekule-svelte';
</script>

<!-- Render Aspirin -->
<KekuleViewer smiles="CC(=O)Oc1ccccc1C(=O)O" height="360px" />
```

## Components

### KekuleViewer

A read-only 2D structure viewer. Renders molecular structures from SMILES strings with optional toolbar and mouse interaction.

```svelte
<KekuleViewer
  smiles="CCO"
  width="100%"
  height="360px"
  showToolbar={false}
  interactive={false}
  background="transparent"
  onReady={(viewer) => console.log('Ready:', viewer)}
  onError={(error) => console.error('Error:', error)}
/>
```

#### Props

| Prop          | Type       | Default         | Description                   |
| ------------- | ---------- | --------------- | ----------------------------- |
| `smiles`      | `string`   | required        | SMILES string to render       |
| `width`       | `string`   | `'100%'`        | CSS width                     |
| `height`      | `string`   | `'360px'`       | CSS height                    |
| `showToolbar` | `boolean`  | `false`         | Show Kekule toolbar           |
| `interactive` | `boolean`  | `false`         | Enable mouse pan/zoom         |
| `background`  | `string`   | `'transparent'` | Canvas background color       |
| `class`       | `string`   | `''`            | Additional CSS classes        |
| `onReady`     | `function` | -               | Callback when viewer is ready |
| `onError`     | `function` | -               | Callback on render failure    |
| `loading`     | `Snippet`  | -               | Custom loading indicator      |
| `error`       | `Snippet`  | -               | Custom error display          |

#### Exported Methods

Use `bind:this` to access these methods:

```svelte
<script lang="ts">
  import { KekuleViewer } from 'kekule-svelte';
  let ref = $state<any>();
</script>

<KekuleViewer smiles="CCO" bind:this={ref} />

<button onclick={() => ref?.downloadSVG('ethanol.svg')}>Download SVG</button>
```

| Method              | Returns          | Description                |
| ------------------- | ---------------- | -------------------------- |
| `getViewer()`       | `unknown`        | Raw Kekule viewer instance |
| `exportSVG()`       | `string \| null` | SVG data URI               |
| `exportPNG()`       | `string \| null` | PNG data URI               |
| `downloadSVG(name)` | `void`           | Trigger SVG download       |
| `downloadPNG(name)` | `void`           | Trigger PNG download       |

### KekuleEditor

A full interactive structure drawing editor powered by Kekule.js Composer. Emits SMILES on every structural change.

```svelte
<script lang="ts">
  import { KekuleEditor } from 'kekule-svelte';
  let smiles = $state('');
</script>

<KekuleEditor
  smiles="c1ccccc1"
  height="480px"
  onSmiles={(s) => (smiles = s)}
  onReady={(editor) => console.log('Editor ready:', editor)}
/>
```

#### Props

| Prop       | Type       | Default   | Description                    |
| ---------- | ---------- | --------- | ------------------------------ |
| `smiles`   | `string`   | `''`      | Initial SMILES to load         |
| `width`    | `string`   | `'100%'`  | CSS width                      |
| `height`   | `string`   | `'480px'` | CSS height                     |
| `class`    | `string`   | `''`      | Additional CSS classes         |
| `onSmiles` | `function` | -         | Callback with SMILES on change |
| `onChange` | `function` | -         | Callback with raw Kekule mol   |
| `onReady`  | `function` | -         | Callback when editor is ready  |
| `loading`  | `Snippet`  | -         | Custom loading indicator       |

#### Exported Methods

| Method              | Returns          | Description                       |
| ------------------- | ---------------- | --------------------------------- |
| `getEditor()`       | `unknown`        | Raw Kekule Composer instance      |
| `getSmiles()`       | `string \| null` | Current structure as SMILES       |
| `getMolBlock()`     | `string \| null` | Current structure as MOL block    |
| `setSmiles(s)`      | `void`           | Load new SMILES programmatically  |
| `clear()`           | `void`           | Clear the canvas                  |
| `undo()`            | `void`           | Undo last action                  |
| `redo()`            | `void`           | Redo last undone action           |
| `downloadSVG(name)` | `void`           | Download current structure as SVG |

### KekuleReaction

Renders a 2D reaction diagram from a reaction SMILES string.

```svelte
<KekuleReaction
  reaction="CCO.CC(=O)O>>CC(=O)OCC.O"
  height="220px"
  onReady={(viewer) => console.log('Ready:', viewer)}
  onError={(error) => console.error('Error:', error)}
/>
```

Reaction SMILES format: `reactant1.reactant2>>product1.product2` (multiple reactants or products separated by dots).

#### Props

| Prop         | Type       | Default         | Description                   |
| ------------ | ---------- | --------------- | ----------------------------- |
| `reaction`   | `string`   | required        | Reaction SMILES string        |
| `width`      | `string`   | `'100%'`        | CSS width                     |
| `height`     | `string`   | `'220px'`       | CSS height                    |
| `background` | `string`   | `'transparent'` | Canvas background color       |
| `class`      | `string`   | `''`            | Additional CSS classes        |
| `onReady`    | `function` | -               | Callback when viewer is ready |
| `onError`    | `function` | -               | Callback on render failure    |
| `loading`    | `Snippet`  | -               | Custom loading indicator      |
| `error`      | `Snippet`  | -               | Custom error display          |

### Kekule3DViewer

A 3D molecular structure viewer using Kekule.js WebGL renderer. Renders molecules in 3D space with rotation and zoom controls.

```svelte
<Kekule3DViewer
  smiles="CCO"
  height="400px"
  renderMode="ballAndStick"
  showToolbar={true}
  onReady={(viewer) => console.log('3D Ready:', viewer)}
  onError={(error) => console.error('Error:', error)}
/>
```

#### Props

| Prop          | Type       | Default          | Description                                                   |
| ------------- | ---------- | ---------------- | ------------------------------------------------------------- |
| `smiles`      | `string`   | `''`             | SMILES string to render                                       |
| `molBlock`    | `string`   | `''`             | MOL block content (alternative)                               |
| `width`       | `string`   | `'100%'`         | CSS width                                                     |
| `height`      | `string`   | `'400px'`        | CSS height                                                    |
| `showToolbar` | `boolean`  | `false`          | Show 3D viewer toolbar                                        |
| `renderMode`  | `string`   | `'ballAndStick'` | Rendering mode (ballAndStick, spaceFill, wireframe, cylinder) |
| `background`  | `string`   | `'white'`        | Canvas background color                                       |
| `class`       | `string`   | `''`             | Additional CSS classes                                        |
| `onReady`     | `function` | -                | Callback when viewer is ready                                 |
| `onError`     | `function` | -                | Callback on render failure                                    |
| `loading`     | `Snippet`  | -                | Custom loading indicator                                      |
| `error`       | `Snippet`  | -                | Custom error display                                          |

#### Exported Methods

| Method              | Returns          | Description                   |
| ------------------- | ---------------- | ----------------------------- |
| `getViewer()`       | `unknown`        | Raw Kekule 3D viewer instance |
| `exportSVG()`       | `string \| null` | SVG data URI                  |
| `exportPNG()`       | `string \| null` | PNG data URI                  |
| `downloadSVG(name)` | `void`           | Trigger SVG download          |
| `downloadPNG(name)` | `void`           | Trigger PNG download          |
| `rotate(x, y, z)`   | `void`           | Rotate molecule               |
| `zoomToFit()`       | `void`           | Zoom to fit molecule          |

## Utilities

### Loader Functions

```typescript
import { loadKekule, isKekuleReady } from 'kekule-svelte';

// Load Kekule.js from CDN (singleton - safe to call multiple times)
const K = await loadKekule();

// Check if already loaded
if (isKekuleReady()) {
  // Kekule.js is available
}
```

Kekule.js is loaded once from jsDelivr CDN when the first component mounts. Subsequent calls return the same Promise.

### Property Calculations

```typescript
import { getMoleculeProperties, computeLipinski, formatFormula, loadKekule } from 'kekule-svelte';

// Get molecular properties from SMILES
const K = await loadKekule();
const props = getMoleculeProperties('CCO', K);
// Returns: { formula: 'C2H6O', molecularWeight: 46.07, atomCount: 9, ... }

// Check Lipinski's Rule of Five
const lipinski = computeLipinski({ mw: 180.16, logp: 1.19, hbd: 1, hba: 4 });
// Returns: { pass: true, rules: [...] }

// Format formula with subscript characters
formatFormula('C9H8O4'); // Returns 'C\u2089H\u2088O\u2084'
```

#### Available Functions

| Function                           | Description                                     |
| ---------------------------------- | ----------------------------------------------- |
| `getMoleculeProperties(smiles, K)` | Extract MW, formula, ring count from SMILES     |
| `computeFormula(atoms)`            | Compute molecular formula in Hill notation      |
| `computeMolecularWeight(atoms)`    | Calculate molecular weight                      |
| `computeRingCount(bonds, atoms)`   | Estimate ring count via Euler's formula         |
| `computeLipinski(input)`           | Lipinski's Rule of Five with per-rule breakdown |
| `formatFormula(formula)`           | Convert ASCII digits to Unicode subscripts      |
| `validateSmiles(smiles, K)`        | Validate SMILES string syntax                   |
| `smilesToMol(smiles, K)`           | Convert SMILES to MOL V2000 format              |
| `smilesToSDF(smiles, K)`           | Convert SMILES to SDF format                    |
| `smilesToSmarts(smiles, K)`        | Convert SMILES to SMARTS pattern                |
| `parseMolBlock(molBlock, K)`       | Parse MOL block and return molecule object      |

### SvelteKit SSR Support

For SvelteKit applications with server-side rendering, use the SSR-safe entry point:

```typescript
// In a +page.svelte or +layout.svelte
<script lang="ts">
  import { onMount } from 'svelte';
  let KekuleViewer: any;

  onMount(async () => {
    // Dynamic import ensures client-side only
    const mod = await import('kekule-svelte/index-ssr');
    KekuleViewer = mod.KekuleViewer;
  });
</script>

{#if KekuleViewer}
  <svelte:component this={KekuleViewer} smiles="CCO" />
{/if}
```

## Custom Loading and Error States

Use Svelte 5 snippets to customize loading and error displays:

```svelte
<KekuleViewer smiles="CCO">
  {#snippet loading()}
    <div class="my-spinner">Loading molecule...</div>
  {/snippet}
  {#snippet error({ error })}
    <div class="my-error">Failed to render: {error}</div>
  {/snippet}
</KekuleViewer>
```

## How It Works

kekule-svelte loads Kekule.js from jsDelivr CDN the first time a component mounts. The loader is a singleton - it returns the same Promise regardless of how many components call it:

```typescript
const K1 = await loadKekule();
const K2 = await loadKekule();
console.log(K1 === K2); // true
```

## Svelte 5 Patterns

This library uses modern Svelte 5 patterns:

| React Pattern         | Svelte 5 Equivalent               |
| --------------------- | --------------------------------- |
| `useRef(null)`        | `let el = $state()` + `bind:this` |
| `useEffect([deps])`   | `$effect(() => { ... })`          |
| `useEffect` cleanup   | Return function from `onMount`    |
| `useImperativeHandle` | `export function getViewer()`     |
| `useState(initial)`   | `let value = $state(initial)`     |
| Render props          | `{#snippet name()}...{/snippet}`  |

## Requirements

- Svelte 5.0.0 or higher
- Browser environment (Kekule.js requires DOM)

## Documentation

Full documentation available at [kekule-svelte.makeez.dev](https://kekule-svelte.makeez.dev)

## License

MIT - [Makeez Labs](https://makeez.dev)
