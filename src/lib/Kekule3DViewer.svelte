<script lang="ts">
  /**
   * Kekule3DViewer
   * Renders a 3D molecular structure from a SMILES or MOL file using Kekule.js WebGL renderer.
   *
   * @example
   * <Kekule3DViewer smiles="CCO" height="400px" />
   *
   * @example with styling options
   * <Kekule3DViewer smiles="CCO" showToolbar={true} renderMode="ballAndStick" />
   */
  import { onMount }         from 'svelte'
  import type { Snippet }    from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { loadKekule }      from './loader.js'
  import type { KekuleModule } from './loader.js'
  import { KekuleError }     from './errors.js'
  import { triggerDownload } from './internal/download.js'
  import KekuleOverlay       from './internal/KekuleOverlay.svelte'

  /** Rendering mode for 3D display */
  export type RenderMode = 'ballAndStick' | 'spaceFill' | 'wireframe' | 'cylinder'

  // ── Props ───────────────────────────────────────────────────

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** SMILES string to render */
    smiles?:       string
    /** MOL block content (alternative to smiles) */
    molBlock?:     string
    /** CSS width value (default: '100%') */
    width?:        string
    /** CSS height value (default: '400px') */
    height?:       string
    /** Show the 3D viewer toolbar */
    showToolbar?:  boolean
    /** Rendering mode for 3D display */
    renderMode?:   RenderMode
    /** Background color (default: 'white') */
    background?:   string
    /** Additional CSS classes */
    class?:        string
    /** Callback fired when viewer is ready */
    onReady?:      (viewer: unknown) => void
    /** Callback fired on render error */
    onError?:      (error: KekuleError) => void
    /** Custom loading indicator snippet */
    loading?:      Snippet
    /** Custom error display snippet - receives { error: string } */
    error?:        Snippet<[{ error: string }]>
  }

  let {
    smiles      = '',
    molBlock    = '',
    width       = '100%',
    height      = '400px',
    showToolbar = false,
    renderMode  = 'ballAndStick',
    background  = 'white',
    class:      className = '',
    onReady,
    onError,
    loading:    loadingSnippet,
    error:      errorSnippet,
    ...restProps
  }: Props = $props()

  // ── Internal state ──────────────────────────────────────────

  let container: HTMLDivElement | undefined = $state()
  let viewer:    unknown = $state(null)
  let isLoading: boolean = $state(true)
  let errorMsg:  string | null = $state(null)
  let K:         KekuleModule | null = $state(null)

  /** Tracks render generation to discard stale RAF callbacks */
  let renderGen = 0

  // ── Lifecycle ───────────────────────────────────────────────

  onMount(() => {
    loadKekule()
      .then(module => { K = module })
      .catch((e: unknown) => {
        const err = e instanceof KekuleError ? e : new KekuleError(
          e instanceof Error ? e.message : 'Failed to load Kekule.js',
          'LOAD_FAILED', e
        )
        errorMsg  = err.message
        isLoading = false
        onError?.(err)
      })

    return () => destroyViewer()
  })

  $effect(() => {
    if (K && (smiles || molBlock)) {
      render3D(smiles || molBlock, smiles ? 'smi' : 'mol')
    }
  })

  // ── Core render ─────────────────────────────────────────────

  function render3D(data: string, format: string) {
    if (!container || !K) return

    errorMsg  = null
    isLoading = true
    const thisGen = ++renderGen

    try {
      if (!data?.trim()) {
        throw new KekuleError('No molecular data provided', 'PARSE_FAILED')
      }

      const mol = K.IO.loadFormatData(data.trim(), format)
      if (!mol) {
        throw new KekuleError('Invalid molecular data - could not parse', 'PARSE_FAILED')
      }

      K.CoordGenerator.prepare3DCoords(mol)
      destroyViewer()

      const mountEl = document.createElement('div')
      container.appendChild(mountEl)

      const v = new K.ChemWidget.Viewer3D(mountEl)
      v.setDimension(width, height)
      v.setPredefinedSetting('basic3D')
      v.setEnableToolbar(showToolbar)
      v.setRenderType(renderMode)
      v.setChemObj(mol)

      viewer = v

      requestAnimationFrame(() => {
        if (thisGen !== renderGen) return // stale render, skip

        const canvas = mountEl.querySelector('canvas') as HTMLCanvasElement | null
        if (canvas) canvas.style.background = background

        try { v.repaint() } catch { /* best-effort */ }

        isLoading = false
        onReady?.(v)
      })
    } catch (e: unknown) {
      destroyViewer()
      const err = e instanceof KekuleError ? e : new KekuleError(
        e instanceof Error ? e.message : 'Failed to render 3D structure',
        'RENDER_FAILED', e
      )
      errorMsg  = err.message
      isLoading = false
      onError?.(err)
    }
  }

  function destroyViewer() {
    if (!container) return
    try { (viewer as { finalize?: () => void })?.finalize?.() } catch { /* ignore */ }
    viewer = null
    while (container.firstChild) container.removeChild(container.firstChild)
  }

  // ── Public API (via bind:this) ───────────────────────────────

  /** Get the raw Kekule 3D viewer instance */
  export function getViewer(): unknown { return viewer }

  /** Export current structure as SVG */
  export function exportSVG(): string | null {
    try {
      return (viewer as { exportToDataUri?: (t: string) => string })
        ?.exportToDataUri?.('image/svg+xml') ?? null
    } catch { return null }
  }

  /** Export current structure as PNG */
  export function exportPNG(): string | null {
    try {
      return (viewer as { exportToDataUri?: (t: string) => string })
        ?.exportToDataUri?.('image/png') ?? null
    } catch { return null }
  }

  /** Trigger browser download as SVG */
  export function downloadSVG(filename = 'molecule3d.svg') {
    const uri = exportSVG()
    if (uri) triggerDownload(uri, filename)
  }

  /** Trigger browser download as PNG */
  export function downloadPNG(filename = 'molecule3d.png') {
    const uri = exportPNG()
    if (uri) triggerDownload(uri, filename)
  }

  /** Rotate the molecule to a specific angle */
  export function rotate(x: number, y: number, z: number) {
    try {
      (viewer as { rotate?: (x: number, y: number, z: number) => void })?.rotate?.(x, y, z)
    } catch { /* ignore */ }
  }

  /** Zoom to fit the molecule in view */
  export function zoomToFit() {
    try {
      (viewer as { zoomToFit?: () => void })?.zoomToFit?.()
    } catch { /* ignore */ }
  }
</script>

<div
  class="kekule-3d-viewer {className}"
  style:width
  style:height
  style="position:relative;overflow:hidden;"
  role="img"
  aria-label="3D molecular structure viewer"
  {...restProps}
>
  <div bind:this={container} style="width:100%;height:100%;"></div>

  <KekuleOverlay {isLoading} {errorMsg} loading={loadingSnippet} error={errorSnippet} />
</div>

<style>
  .kekule-3d-viewer {
    position: relative;
    overflow: hidden;
  }
</style>
