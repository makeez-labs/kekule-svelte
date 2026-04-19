<script lang="ts">
  /**
   * KekuleViewer
   * Renders a 2D structural diagram from a SMILES string using Kekule.js.
   *
   * @example
   * <KekuleViewer smiles="CCO" height="300px" />
   *
   * @example with custom slots
   * <KekuleViewer smiles={smiles} bind:this={ref}>
   *   {#snippet loading()}<MySpinner />{/snippet}
   *   {#snippet error({ error })}<p>{error}</p>{/snippet}
   * </KekuleViewer>
   */
  import { onMount }        from 'svelte'
  import type { Snippet }   from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { loadKekule }     from './loader.js'
  import type { KekuleModule } from './loader.js'
  import { KekuleError }    from './errors.js'
  import { triggerDownload } from './internal/download.js'
  import KekuleOverlay      from './internal/KekuleOverlay.svelte'

  // ── Props ───────────────────────────────────────────────────

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** SMILES string to render */
    smiles:          string
    /** CSS width  (default: 100%) */
    width?:          string
    /** CSS height (default: 360px) */
    height?:         string
    /** Show the Kekule built-in toolbar */
    showToolbar?:    boolean
    /** Enable mouse interaction (pan, zoom) */
    interactive?:    boolean
    /** Canvas background colour */
    background?:     string
    /** Extra CSS classes on the wrapper div */
    class?:          string
    /** Called once the viewer is ready with the raw Kekule viewer */
    onReady?:        (viewer: unknown) => void
    /** Called when render fails */
    onError?:        (error: KekuleError) => void
    /** Custom loading indicator */
    loading?:        Snippet
    /** Custom error display — receives { error: string } */
    error?:          Snippet<[{ error: string }]>
  }

  let {
    smiles,
    width       = '100%',
    height      = '360px',
    showToolbar = false,
    interactive = false,
    background  = 'transparent',
    class:      className = '',
    onReady,
    onError,
    loading:    loadingSnippet,
    error:      errorSnippet,
    ...restProps
  }: Props = $props()

  // ── Internal state ──────────────────────────────────────────

  let container:  HTMLDivElement | undefined = $state()
  let viewer:     unknown = $state(null)
  let isLoading:  boolean = $state(true)
  let errorMsg:   string | null = $state(null)
  let K:          KekuleModule | null = $state(null)

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

  // Re-render whenever smiles or K changes
  $effect(() => {
    if (K && smiles !== undefined) {
      render(smiles)
    }
  })

  // ── Core render ─────────────────────────────────────────────

  function render(smilesStr: string) {
    if (!container || !K) return

    errorMsg  = null
    isLoading = true
    const thisGen = ++renderGen

    try {
      if (!smilesStr?.trim()) {
        throw new KekuleError('No SMILES string provided', 'PARSE_FAILED')
      }

      const mol = K.IO.loadFormatData(smilesStr.trim(), 'smi')
      if (!mol) {
        throw new KekuleError('Invalid SMILES — could not parse molecule', 'PARSE_FAILED')
      }

      K.CoordGenerator.prepare2DCoords(mol)

      destroyViewer()

      const mountEl = document.createElement('div')
      container.appendChild(mountEl)

      const v = new K.ChemWidget.Viewer(mountEl)
      v.setDimension(width, height)
      v.setPredefinedSetting('static2D')
      v.setEnableToolbar(showToolbar)
      v.setEnableDirectInteraction(interactive)
      v.setChemObj(mol)

      viewer = v

      requestAnimationFrame(() => {
        if (thisGen !== renderGen) return // stale render, skip

        // Apply background to the canvas element Kekule injects
        const canvas = mountEl.querySelector('canvas') as HTMLCanvasElement | null
        if (canvas) canvas.style.background = background

        try { v.repaint() } catch { /* best-effort */ }

        isLoading = false
        onReady?.(v)
      })

    } catch (e: unknown) {
      destroyViewer()
      const err = e instanceof KekuleError ? e : new KekuleError(
        e instanceof Error ? e.message : 'Failed to render molecule',
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

  /** Returns the raw Kekule viewer instance */
  export function getViewer(): unknown { return viewer }

  /** Export current molecule as SVG data URI */
  export function exportSVG(): string | null {
    try {
      return (viewer as { exportToDataUri: (t: string) => string })
        ?.exportToDataUri('image/svg+xml') ?? null
    } catch { return null }
  }

  /** Export current molecule as PNG data URI */
  export function exportPNG(): string | null {
    try {
      return (viewer as { exportToDataUri: (t: string) => string })
        ?.exportToDataUri('image/png') ?? null
    } catch { return null }
  }

  /** Trigger a browser download of the molecule as SVG */
  export function downloadSVG(filename = 'molecule.svg') {
    const uri = exportSVG()
    if (uri) triggerDownload(uri, filename)
  }

  /** Trigger a browser download of the molecule as PNG */
  export function downloadPNG(filename = 'molecule.png') {
    const uri = exportPNG()
    if (uri) triggerDownload(uri, filename)
  }
</script>

<div
  class="kekule-viewer {className}"
  style:width
  style:height
  style="position:relative;overflow:hidden;"
  role="img"
  aria-label="Molecular structure viewer"
  {...restProps}
>
  <!-- Kekule mounts its canvas here -->
  <div bind:this={container} style="width:100%;height:100%;"></div>

  <KekuleOverlay {isLoading} {errorMsg} loading={loadingSnippet} error={errorSnippet} />
</div>

<style>
  .kekule-viewer {
    position: relative;
    overflow: hidden;
  }
</style>
