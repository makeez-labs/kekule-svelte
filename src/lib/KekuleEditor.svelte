<script lang="ts">
  /**
   * KekuleEditor
   * Full interactive 2D structure editor powered by Kekule.js Composer.
   * Emits SMILES on every change via the onSmiles callback.
   *
   * @example
   * <KekuleEditor
   *   smiles="c1ccccc1"
   *   onSmiles={(s) => console.log(s)}
   *   bind:this={editorRef}
   * />
   */
  import { onMount }           from 'svelte'
  import type { Snippet }      from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { loadKekule }        from './loader.js'
  import type { KekuleModule } from './loader.js'
  import { KekuleError }       from './errors.js'
  import { triggerDownload }   from './internal/download.js'
  import KekuleOverlay         from './internal/KekuleOverlay.svelte'

  // ── Props ───────────────────────────────────────────────────

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** Initial SMILES to load */
    smiles?:   string
    width?:    string
    height?:   string
    class?:    string
    /** Called on every structural change — emits SMILES string */
    onSmiles?: (smiles: string) => void
    /** Called on every structural change — emits raw Kekule mol */
    onChange?: (mol: unknown) => void
    /** Called once the editor is ready */
    onReady?:  (editor: unknown) => void
    /** Called when the editor fails to load */
    onError?:  (error: KekuleError) => void
    /** Custom loading indicator */
    loading?:  Snippet
    /** Custom error display — receives { error: string } */
    error?:    Snippet<[{ error: string }]>
  }

  let {
    smiles   = '',
    width    = '100%',
    height   = '480px',
    class:   className = '',
    onSmiles,
    onChange,
    onReady,
    onError,
    loading: loadingSnippet,
    error:   errorSnippet,
    ...restProps
  }: Props = $props()

  // ── Internal state ──────────────────────────────────────────

  let container: HTMLDivElement | undefined = $state()
  let editor:    unknown = $state(null)
  let isLoading: boolean = $state(true)
  let errorMsg:  string | null = $state(null)
  let K:         KekuleModule | null = $state(null)

  // ── Lifecycle ───────────────────────────────────────────────

  onMount(() => {
    loadKekule()
      .then(module => { K = module; initEditor() })
      .catch((e: unknown) => {
        const err = e instanceof KekuleError ? e : new KekuleError(
          e instanceof Error ? e.message : 'Failed to load Kekule.js',
          'LOAD_FAILED', e
        )
        errorMsg  = err.message
        isLoading = false
        onError?.(err)
      })

    return () => destroyEditor()
  })

  // ── Init ────────────────────────────────────────────────────

  function initEditor() {
    if (!container || !K) return

    const mountEl = document.createElement('div')
    container.appendChild(mountEl)

    const ed = new K.Editor.Composer(mountEl)
    ed.setDimension(width, height)
    ed.setEnableToolbar(true)

    editor = ed

    if (smiles?.trim()) loadSmilesIntoEditor(smiles)

    ed.addEventListener('valueChange', handleChange)

    isLoading = false
    onReady?.(ed)
  }

  function handleChange() {
    if (!editor || !K) return
    try {
      const mol = (editor as { getChemObj: () => unknown }).getChemObj()
      if (!mol) return

      onChange?.(mol)

      const out = K.IO.saveFormatData(mol, 'smi') as string | null
      if (out?.trim()) onSmiles?.(out.trim())
    } catch {
      // Partial structures during drawing will fail silently
    }
  }

  function loadSmilesIntoEditor(s: string) {
    if (!editor || !K || !s.trim()) return
    try {
      const mol = K.IO.loadFormatData(s.trim(), 'smi')
      if (mol) {
        K.CoordGenerator.prepare2DCoords(mol)
        ;(editor as { setChemObj: (m: unknown) => void }).setChemObj(mol)
      }
    } catch (e) {
      console.warn('[kekule-svelte] Could not load SMILES into editor:', e)
    }
  }

  function destroyEditor() {
    if (!container) return
    try {
      (editor as { removeEventListener?: (e: string, h: () => void) => void })
        ?.removeEventListener?.('valueChange', handleChange)
      ;(editor as { finalize?: () => void })?.finalize?.()
    } catch { /* ignore */ }
    editor = null
    while (container.firstChild) container.removeChild(container.firstChild)
  }

  // ── Public API ───────────────────────────────────────────────

  /** Returns the raw Kekule Composer instance */
  export function getEditor(): unknown { return editor }

  /** Returns the current structure as SMILES */
  export function getSmiles(): string | null {
    if (!editor || !K) return null
    try {
      const mol = (editor as { getChemObj: () => unknown }).getChemObj()
      return mol ? ((K.IO.saveFormatData(mol, 'smi') as string | null)?.trim() ?? null) : null
    } catch { return null }
  }

  /** Returns the current structure as MOL block */
  export function getMolBlock(): string | null {
    if (!editor || !K) return null
    try {
      const mol = (editor as { getChemObj: () => unknown }).getChemObj()
      return mol ? ((K.IO.saveFormatData(mol, 'mol') as string | null) ?? null) : null
    } catch { return null }
  }

  /** Load a new SMILES into the editor programmatically */
  export function setSmiles(newSmiles: string) { loadSmilesIntoEditor(newSmiles) }

  /** Clear the canvas */
  export function clear() { (editor as { clearAll?: () => void })?.clearAll?.() }

  /** Undo the last action */
  export function undo() { (editor as { undo?: () => void })?.undo?.() }

  /** Redo the last undone action */
  export function redo() { (editor as { redo?: () => void })?.redo?.() }

  /** Download current structure as SVG */
  export function downloadSVG(filename = 'structure.svg') {
    if (!editor) return
    try {
      const uri = (editor as { exportToDataUri: (t: string) => string })
        .exportToDataUri('image/svg+xml')
      if (uri) triggerDownload(uri, filename)
    } catch { /* ignore */ }
  }
</script>

<div
  class="kekule-editor {className}"
  style:width
  style:height
  style="position:relative;overflow:hidden;"
  {...restProps}
>
  <div bind:this={container} style="width:100%;height:100%;"></div>

  <KekuleOverlay {isLoading} {errorMsg} loading={loadingSnippet} error={errorSnippet} />
</div>

<style>
  .kekule-editor {
    position: relative;
    overflow: hidden;
  }
</style>
