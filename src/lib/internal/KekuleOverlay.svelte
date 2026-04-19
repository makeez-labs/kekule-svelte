<script lang="ts">
  /**
   * KekuleOverlay (internal)
   * Shared loading spinner + error overlay used by all Kekule components.
   * Not exported to consumers — internal only.
   */
  import type { Snippet } from 'svelte'

  interface Props {
    isLoading: boolean
    errorMsg: string | null
    /** Custom loading indicator */
    loading?: Snippet
    /** Custom error display — receives { error: string } */
    error?: Snippet<[{ error: string }]>
  }

  let {
    isLoading,
    errorMsg,
    loading: loadingSnippet,
    error: errorSnippet,
  }: Props = $props()
</script>

{#if isLoading}
  <div class="kekule-overlay" aria-live="polite" aria-busy="true">
    {#if loadingSnippet}
      {@render loadingSnippet()}
    {:else}
      <div class="kekule-spinner" role="status" aria-label="Loading..."></div>
    {/if}
  </div>
{/if}

{#if errorMsg && !isLoading}
  <div class="kekule-overlay kekule-error-overlay" role="alert">
    {#if errorSnippet}
      {@render errorSnippet({ error: errorMsg })}
    {:else}
      <p class="kekule-error-text">{errorMsg}</p>
    {/if}
  </div>
{/if}

<style>
  .kekule-overlay {
    position:        absolute;
    inset:           0;
    display:         flex;
    align-items:     center;
    justify-content: center;
    background:      rgba(255, 255, 255, 0.92);
    z-index:         10;
  }

  .kekule-error-overlay {
    background: rgba(255, 255, 255, 0.97);
  }

  .kekule-spinner {
    width:             24px;
    height:            24px;
    border:            2.5px solid #e5e7eb;
    border-top-color:  #2563eb;
    border-radius:     50%;
    animation:         kekule-spin 0.7s linear infinite;
  }

  .kekule-error-text {
    font-size:   13px;
    color:       #dc2626;
    text-align:  center;
    padding:     16px;
    max-width:   260px;
    line-height: 1.5;
    font-family: system-ui, sans-serif;
  }

  @keyframes kekule-spin {
    to { transform: rotate(360deg); }
  }
</style>
