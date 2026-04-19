<script lang="ts">
  /**
   * KekuleReaction
   * Renders a 2D reaction diagram from a reaction SMILES string.
   *
   * Reaction SMILES format: "reactant1.reactant2>>product1.product2"
   * Multiple reactants or products are separated by dots (.).
   *
   * @example
   * <KekuleReaction reaction="CCO.CC(=O)O>>CC(=O)OCC.O" height="240px" />
   */
  import { onMount }         from 'svelte'
  import type { Snippet }    from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { loadKekule }      from './loader.js'
  import type { KekuleModule } from './loader.js'
  import { KekuleError }     from './errors.js'
  import KekuleOverlay       from './internal/KekuleOverlay.svelte'

  // ── Props ───────────────────────────────────────────────────

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** Reaction SMILES string in format "reactants>>products" */
    reaction:      string
    /** CSS width value (default: '100%') */
    width?:        string
    /** CSS height value (default: '220px') */
    height?:       string
    /** Canvas background color (default: 'transparent') */
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
    reaction,
    width       = '100%',
    height      = '220px',
    background  = 'transparent',
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
    if (K && reaction !== undefined) render(reaction)
  })

  // ── Core render ─────────────────────────────────────────────

  function render(rxn: string) {
    if (!container || !K) return

    errorMsg  = null
    isLoading = true
    const thisGen = ++renderGen

    try {
      if (!rxn?.trim()) {
        throw new KekuleError('No reaction SMILES provided', 'PARSE_FAILED')
      }

      const rxnObj = K.IO.loadFormatData(rxn.trim(), 'smi')
      if (!rxnObj) {
        throw new KekuleError('Invalid reaction SMILES', 'PARSE_FAILED')
      }

      K.CoordGenerator.prepare2DCoords(rxnObj)
      destroyViewer()

      const mountEl = document.createElement('div')
      container.appendChild(mountEl)

      const v = new K.ChemWidget.Viewer(mountEl)
      v.setDimension(width, height)
      v.setPredefinedSetting('static2D')
      v.setEnableToolbar(false)
      v.setEnableDirectInteraction(false)
      v.setChemObj(rxnObj)

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
        e instanceof Error ? e.message : 'Failed to render reaction',
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

  /** Export current reaction as SVG data URI */
  export function exportSVG(): string | null {
    try {
      return (viewer as { exportToDataUri: (t: string) => string })
        ?.exportToDataUri('image/svg+xml') ?? null
    } catch { return null }
  }
</script>

<div
  class="kekule-reaction {className}"
  style:width
  style:height
  style="position:relative;overflow:hidden;"
  role="img"
  aria-label="Chemical reaction diagram"
  {...restProps}
>
  <div bind:this={container} style="width:100%;height:100%;"></div>

  <KekuleOverlay {isLoading} {errorMsg} loading={loadingSnippet} error={errorSnippet} />
</div>

<style>
  .kekule-reaction {
    position: relative;
    overflow: hidden;
  }
</style>
