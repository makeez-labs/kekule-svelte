/**
 * @fileoverview Structured error types for kekule-svelte.
 * @module errors
 */

/**
 * Error codes for kekule-svelte operations.
 * Consumers can switch on these codes for programmatic error handling.
 */
export type KekuleErrorCode =
  | 'LOAD_FAILED'
  | 'LOAD_TIMEOUT'
  | 'PARSE_FAILED'
  | 'RENDER_FAILED'
  | 'SSR_UNSUPPORTED';

/**
 * Structured error class for kekule-svelte.
 *
 * @example
 * ```ts
 * onError={(err) => {
 *   if (err.code === 'LOAD_TIMEOUT') showRetryButton();
 *   if (err.code === 'PARSE_FAILED') highlightInput();
 * }}
 * ```
 */
export class KekuleError extends Error {
  public readonly name = 'KekuleError';

  constructor(
    message: string,
    public readonly code: KekuleErrorCode,
    public readonly cause?: unknown
  ) {
    super(message);
  }
}
